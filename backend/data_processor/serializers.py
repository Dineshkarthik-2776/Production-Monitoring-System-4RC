from rest_framework import serializers
from .models import ChangeoverSummary, RecipeMaster, ChangeoverCorrectionRequest, StandardTimeMaster


class StandardTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = StandardTimeMaster
        fields = '__all__'


class RecipeUploadSerializer(serializers.Serializer):
    """
    Serializer for validating uploaded recipe files or JSON data.
    """
    excel_file = serializers.FileField(required=False)
    data = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="Optional JSON data instead of file upload."
    )

    def validate(self, attrs):
        if not attrs.get('excel_file') and not attrs.get('data'):
            raise serializers.ValidationError("Either 'excel_file' or 'data' must be provided.")
        if attrs.get('excel_file') and attrs.get('data'):
            raise serializers.ValidationError("Provide only one of 'excel_file' or 'data', not both.")
        return attrs

    def validate_excel_file(self, value):
        filename = value.name.lower()
        if not (filename.endswith('.csv') or filename.endswith('.xls') or filename.endswith('.xlsx')):
            raise serializers.ValidationError("File must be a .csv or .xlsx format.")
        return value




class ChangeoverDetailSerializer(serializers.ModelSerializer):
    """
    Serializes a single changeover event.
    This is for the "details" array in your sampleData.
    """
    # 1. We're RENAMING fields from our database (like 'current_recipe')
    #    to match your frontend's JSON (like 'material').
    material = serializers.CharField(source='current_recipe')
    Std = serializers.FloatField(source='standard_time')
    act = serializers.FloatField(source='setup_time_actual')
    static = serializers.FloatField(source='static_setup_time')
    ramp = serializers.FloatField(source='ramp_up_time')
    start_time = serializers.DateTimeField(source='recipe_change_time')

    # 2. This creates a NEW field called 'shoot' that doesn't exist
    #    in our database.
    shoot = serializers.SerializerMethodField()

    class Meta:
        model = ChangeoverSummary
        fields = [
            'id',
            'material',
            'Std',
            'act',
            'static',
            'ramp',
            'shoot',
            'start_time',
            'overshoot_category',
            'overshoot_reason'
        ]

    # 4. This function provides the value for 'shoot'.
    #    'obj' is the ChangeoverSummary object for the current row.
    def get_shoot(self, obj):
        """
        Calculates Shoot = Actual Time - Standard Time
        """
        if obj.setup_time_actual is not None and obj.standard_time is not None:
            shoot_value = obj.setup_time_actual - obj.standard_time
            return round(shoot_value, 2)

        # Return null if we can't calculate it
        return None

class ChangeoverUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for a worker to update the reason and category for an overshoot.
    """
    class Meta:
        model = ChangeoverSummary
        # These are the only two fields a worker is allowed to change
        fields = [
            'overshoot_category',
            'overshoot_reason'
        ]

class ChangeoverCorrectionRequestSerializer(serializers.ModelSerializer):
    """
    Serializer to display correction requests to managers.
    """
    changeover_id = serializers.PrimaryKeyRelatedField(read_only=True, source='changeover.id')
    requested_by_email = serializers.EmailField(read_only=True, source='requested_by.email')
    current_recipe = serializers.CharField(read_only=True, source='changeover.current_recipe')
    
    class Meta:
        model = ChangeoverCorrectionRequest
        fields = [
            'id', 'changeover_id', 'requested_by_email', 'current_recipe',
            'old_category', 'old_reason', 
            'new_category', 'new_reason', 
            'status', 'created_at'
        ]

