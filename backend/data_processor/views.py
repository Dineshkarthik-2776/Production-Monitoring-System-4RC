import datetime  # ✅ For datetime handling
import pandas as pd
import io
from django.db.models import Sum, Count, F, FloatField, Avg, Q  # <-- Make sure Avg is imported
from django.http import HttpResponse
from django.shortcuts import render
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.parsers import MultiPartParser, FormParser ,JSONParser
from rest_framework.permissions import IsAuthenticated
from user_authentication.permissions import IsManagerUser
from .models import RecipeMaster, ChangeoverSummary, StandardTimeMaster
from .serializers import (
    RecipeMasterSerializer,
    ChangeoverDetailSerializer,
    ChangeoverUpdateSerializer,
    StandardTimeSerializer
)


# ============================================================
# 🕒 Standard Time Master API
# ============================================================

class StandardTimeListCreateAPIView(generics.ListCreateAPIView):
    """
    Handles listing and saving (add/update) standard time records.
    """
    queryset = StandardTimeMaster.objects.all()
    serializer_class = StandardTimeSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        if isinstance(data, list):
            for item in data:
                changeover_key = item.get('changeover_key')
                standard_time = item.get('standard_time')
                if changeover_key and standard_time is not None:
                    StandardTimeMaster.objects.update_or_create(
                        changeover_key=changeover_key,
                        defaults={'standard_time': standard_time}
                    )
            return Response({"message": "Standard times updated successfully."}, status=status.HTTP_200_OK)
        return super().post(request, *args, **kwargs)

class StandardTimeDeleteAPIView(generics.DestroyAPIView):
    """
    Remove a mapping.
    """
    queryset = StandardTimeMaster.objects.all()
    serializer_class = StandardTimeSerializer
    permission_classes = [IsAuthenticated]



# ============================================================
# 📁 Recipe Upload API
# ============================================================

class RecipeMasterAPIView(generics.ListAPIView):
    """
    API endpoint to list all recipes.
    """
    queryset = RecipeMaster.objects.all()
    serializer_class = RecipeMasterSerializer
    permission_classes = [IsAuthenticated]


class RecipeMasterUpdateAPIView(generics.UpdateAPIView):
    """
    API endpoint to update recipe_type and target_speed.
    recipe_code and sap_code are read-only.
    """
    queryset = RecipeMaster.objects.all()
    serializer_class = RecipeMasterSerializer
    permission_classes = [IsAuthenticated]

class RecipeExportAPIView(APIView):
    """
    API endpoint to export all RecipeMaster data as JSON or Excel.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            export_format = request.query_params.get('format', 'json').lower()

            recipes = RecipeMaster.objects.all()

            if not recipes.exists():
                return Response(
                    {"message": "No recipes found.", "data": []},
                    status=status.HTTP_200_OK
                )

            # JSON Format
            if export_format == 'json':
                data = {
                    r.recipe_code: {
                        "type": r.recipe_type,
                        "target_speed": r.target_speed
                    }
                    for r in recipes
                }
                return Response(data, status=status.HTTP_200_OK)

            # Excel Format
            df = pd.DataFrame(list(recipes.values()))
            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
                df.to_excel(writer, index=False, sheet_name='Recipes')
            buffer.seek(0)

            response = HttpResponse(
                buffer,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="RecipeMaster_Export.xlsx"'
            return response

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Failed to generate export.",
                    "details": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ============================================================
# ⚠️ Missing Recipe Warning API
# ============================================================

class MissingRecipeWarningAPIView(APIView):
    """
    API endpoint to fetch distinct recipe codes that caused data to be skipped
    due to missing target speeds in the last 3 days.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from .models import RawLineData
        from django.utils import timezone
        
        three_days_ago = timezone.now() - datetime.timedelta(days=3)
        
        missing_recipes = list(RawLineData.objects.filter(
            status="SKIPPED_NO_TARGET_SPEED",
            timestamp__gte=three_days_ago
        ).values_list('recipe_code', flat=True).distinct())
        
        # Ensure we display EXACTLY the string `tasks.py` expects (Strip spaces + Check SAP Map)
        SAP_recipe_mapping = {
            'CWBHT43BELT1': 'CP200', 'CWCH30256': 'CP 700', 'CWBP65': 'CP 650', 'CWBP60': 'CP 500',
            'CWBHT40S564': 'CP 840', 'CWBHTCP100': 'CPJ114', 'CWBHTCP51': 'CP 51',
            'CAP 66': 'CAP 28', 'CPJ 114': 'CPJ114'
        }
        
        clean_unique_recipes = list(set(
            SAP_recipe_mapping.get(r.strip(), r.strip()) for r in missing_recipes if r
        ))
        
        return Response({
            "warning": bool(clean_unique_recipes),
            "message": "These recipes have run on the machine but are missing target speeds in RecipeMaster. Please upload them to prevent data loss." if clean_unique_recipes else "All running recipes have target speeds.",
            "missing_recipe_codes": clean_unique_recipes
        }, status=status.HTTP_200_OK)


class ChangeoverStatsAPIView(APIView):
    """
    API endpoint to retrieve all stats for the frontend dashboard:
    1. Grouped table data (for sampleData)
    2. Grouped bar chart data (for Overshoot Categories)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        print("\n" + "=" * 50)
        print("DEBUGGING ChangeoverStatsAPIView")
        print("=" * 50)

        # 1️⃣ Get date parameters
        from_date_str = request.query_params.get('from_date', None)
        to_date_str = request.query_params.get('to_date', None)
        print("Timestamp : ",datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        print(f"1. Received params: from_date={from_date_str}, to_date={to_date_str}")

        # 2️⃣ Default: show all available shifts for calendar yesterday and today
        if not from_date_str and not to_date_str:
            now_local = timezone.localtime()
            from_date_str = (now_local.date() - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
            to_date_str = now_local.date().strftime('%Y-%m-%d')
            print(f"2. Using default dates: {from_date_str} to {to_date_str}")

        # 3️⃣ Base queryset
        all_summaries = ChangeoverSummary.objects.all()
        print(f"3. Total summaries in DB (before filter): {all_summaries.count()}")

        # 4️⃣ Apply date filtering
        if from_date_str and to_date_str:
            try:
                from_date_obj = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
                to_date_obj = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()

                print(f"4. Querying by Production Date: GTE '{from_date_obj}' and LTE '{to_date_obj}'")

                # Fallback logic for old records that don't have production_date yet
                # from_dt = 7am on from_date, to_dt = 7am on to_date + 1 day
                from_dt_fallback = timezone.make_aware(datetime.datetime.combine(from_date_obj, datetime.time(7, 0)))
                to_dt_fallback = timezone.make_aware(datetime.datetime.combine(to_date_obj + datetime.timedelta(days=1), datetime.time(7, 0)))

                all_summaries = all_summaries.filter(
                    Q(production_date__gte=from_date_obj, production_date__lte=to_date_obj) |
                    Q(production_date__isnull=True, recipe_change_time__gte=from_dt_fallback, recipe_change_time__lt=to_dt_fallback)
                )
                print(f"5. Summaries found AFTER date filter: {all_summaries.count()}")

            except ValueError:
                return Response(
                    {"error": "Invalid date format. Please use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 5️⃣ Apply Shift Filtering
        shift = request.query_params.get('shift', None)
        if shift:
            shift = shift.upper()
            print(f"5. Applying Shift Filter: {shift}")
            if shift in ['A', 'B', 'C']:
                if shift == 'A':
                    fallback_filter = Q(recipe_change_time__time__range=('07:00', '15:00'))
                elif shift == 'B':
                    fallback_filter = Q(recipe_change_time__time__range=('15:00', '23:00'))
                else: # C
                    fallback_filter = Q(recipe_change_time__time__gte='23:00') | Q(recipe_change_time__time__lt='07:00')
                
                all_summaries = all_summaries.filter(
                    Q(shift=shift) | (Q(shift__isnull=True) & fallback_filter)
                )
            
            print(f"6. Summaries found AFTER shift filter: {all_summaries.count()}")

        # --- 1️⃣ Build grouped summary for table ---

        grouped_summary = (
            all_summaries
            .values('change_over_type')
            .annotate(
                Std=Avg('standard_time'),
                act=Avg('setup_time_actual'),
                static=Avg('static_setup_time'),
                ramp=Avg('ramp_up_time'),
                # === THIS IS THE CORRECTED LINE ===
                shoot=Avg(F('setup_time_actual') - F('standard_time'), output_field=FloatField()),
                count=Count('id')
            )
            .order_by('change_over_type')
        )

        grouped_summary_list = list(grouped_summary)
        print(f"6. Grouped data for table: {grouped_summary_list}")

        # --- 2️⃣ Build structured table data ---

        # ✅ FIX: N+1 query solution
        # Fetches all objects ONCE. We will filter this list in Python.
        # This is required to use your Serializer.
        all_individual_summaries = list(all_summaries)
        print(f"7. Fetched {len(all_individual_summaries)} individual summary objects for serializer.")

        table_data_list = []
        for idx, group in enumerate(grouped_summary_list, start=1):
            change_type = group['change_over_type']
            if not change_type:
                continue

            # Python-side filtering (FAST)
            # Find all objects that match this group
            summaries_for_type = [
                summary for summary in all_individual_summaries
                if summary.change_over_type == change_type
            ]

            # ✅ FIX: Use your ChangeoverDetailSerializer
            detail_serializer = ChangeoverDetailSerializer(summaries_for_type, many=True)
            details_data = detail_serializer.data

            table_data_list.append({
                "id": idx,
                "type": change_type,
                "Std": round(group['Std'] or 0, 2),
                "act": round(group['act'] or 0, 2),
                "static": round(group['static'] or 0, 2),
                "ramp": round(group['ramp'] or 0, 2),
                "shoot": round(group['shoot'] or 0, 2), # This line now uses the corrected 'shoot' value
                "count": group['count'],
                "details": details_data
            })
        print(f"8. Final table_data (with nested details) count: {len(table_data_list)}")

        # --- 3️⃣ Build bar chart data ---

        # ✅ FIX: Using your bar chart logic
        bar_chart_data = list(
            all_summaries
            .filter(overshoot_category__isnull=False)
            .exclude(overshoot_category=ChangeoverSummary.OvershootCategory.NONE)
            .exclude(overshoot_category=ChangeoverSummary.OvershootCategory.OTHER)  # From your snippet
            .values('overshoot_category')
            .annotate(value=Count('id'))
            .order_by('-value')  # From your snippet
        )
        # Rename field (from your snippet)
        for item in bar_chart_data:
            item['category'] = item.pop('overshoot_category')

        print(f"9. Final bar_chart_data: {bar_chart_data}")
        print("=" * 50 + "\n")

        # --- 4️⃣ Return final response ---
        final_response = {
            "table_data": table_data_list,
            "bar_chart_data": bar_chart_data
        }
        return Response(final_response, status=status.HTTP_200_OK)

# ============================================================
# ✏️ Changeover Update API
# ============================================================

class ChangeoverUpdateAPIView(generics.UpdateAPIView):
    """
    API endpoint for updates.
    - Managers: Can overwrite anytime.
    - Workers:
        - First time entry: Allowed.
        - < 5 hours since setup_complete: Allowed.
        - > 5 hours: PROCESSED AS REQUEST (creates ChangeoverCorrectionRequest).
    """
    queryset = ChangeoverSummary.objects.all()
    serializer_class = ChangeoverUpdateSerializer
    permission_classes = [IsAuthenticated]

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()

        # 1. Validation (Same as before)
        if instance.setup_time_actual is None or instance.standard_time is None:
            return Response(
                {"error": "Cannot add reason. Time data is not calculated."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if instance.setup_time_actual <= instance.standard_time:
            return Response(
                {"error": "No overshoot occurred. A reason and category cannot be added."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Check Role
        user = request.user
        is_manager = (user.role == 'manager' or user.role == 'admin')

        # 3. Manager Logic
        if is_manager:
            return super().partial_update(request, *args, **kwargs)

        # 4. Worker Logic
        # ⚠️ TESTING OVERRIDE: Allow creating a request even if valid, for validation
        force_test = request.query_params.get('test', 'false').lower() == 'true'

        if not force_test:
            # Case A: First time entry? (overshoot_reason is null or empty)
            if not instance.overshoot_reason:
                return super().partial_update(request, *args, **kwargs)

            # Case B: Within 5 hours window?
            # Use setup_complete_timestamp or fallback to recipe_change_time
            base_time = instance.setup_complete_timestamp or instance.recipe_change_time
            
            if base_time:
                 # Ensure base_time is offset-aware/naive matching timezone.now()
                 # If using UTC=True, base_time is aware.
                 now = timezone.now()
                 diff = now - base_time
                 hours_elapsed = diff.total_seconds() / 3600.0

                 if hours_elapsed <= 5.0:
                     return super().partial_update(request, *args, **kwargs)

        # Case C: Window expired -> Create CORRECTION REQUEST
        new_category = request.data.get('overshoot_category')
        new_reason = request.data.get('overshoot_reason')

        if not new_category or not new_reason:
            return Response(
                {"error": "Category and Reason are required for a request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the request
        from .models import ChangeoverCorrectionRequest
        
        correction_req = ChangeoverCorrectionRequest.objects.create(
            changeover=instance,
            requested_by=user,
            old_category=instance.overshoot_category,
            old_reason=instance.overshoot_reason,
            new_category=new_category,
            new_reason=new_reason,
            status=ChangeoverCorrectionRequest.Status.PENDING
        )

        return Response(
            {
                "message": "Time window expired. Correction request submitted for Manager approval.",
                "request_id": correction_req.id
            },
            status=status.HTTP_202_ACCEPTED
        )


# ============================================================
# 🛡️ Manager Approval Views
# ============================================================
from .serializers import ChangeoverCorrectionRequestSerializer
from .models import ChangeoverCorrectionRequest

class CorrectionRequestListAPIView(generics.ListAPIView):
    """
    List all PENDING correction requests.
    Managers only.
    """
    permission_classes = [IsManagerUser]
    serializer_class = ChangeoverCorrectionRequestSerializer

    def get_queryset(self):
        return ChangeoverCorrectionRequest.objects.filter(status=ChangeoverCorrectionRequest.Status.PENDING)


class CorrectionRequestActionAPIView(APIView):
    """
    Approve or Reject a correction request.
    Managers only.
    """
    permission_classes = [IsManagerUser]

    def post(self, request, pk, *args, **kwargs):
        try:
            correction_req = ChangeoverCorrectionRequest.objects.get(pk=pk)
        except ChangeoverCorrectionRequest.DoesNotExist:
            return Response({"error": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action') # 'approve' or 'reject'

        if correction_req.status != ChangeoverCorrectionRequest.Status.PENDING:
             return Response({"error": "Request is already processed."}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'approve':
            # 1. Update the actual ChangeoverSummary
            summary = correction_req.changeover
            summary.overshoot_category = correction_req.new_category
            summary.overshoot_reason = correction_req.new_reason
            summary.save()

            # 2. Mark request as APPROVED
            correction_req.status = ChangeoverCorrectionRequest.Status.APPROVED
            correction_req.save()
            
            return Response({"message": "Request Approved and Updated."}, status=status.HTTP_200_OK)

        elif action == 'reject':
            correction_req.status = ChangeoverCorrectionRequest.Status.REJECTED
            correction_req.save()
            return Response({"message": "Request Rejected."}, status=status.HTTP_200_OK)

        else:
            return Response({"error": "Invalid action. Use 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)
