from rest_framework import serializers
from .models import ChangeoverSummary, RecipeMaster, ChangeoverCorrectionRequest, StandardTimeMaster


class StandardTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = StandardTimeMaster
        fields = '__all__'
        read_only_fields = ['changeover_key']


class RecipeMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeMaster
        fields = '__all__'
        read_only_fields = ['recipe_code', 'sap_code']




class ChangeoverDetailSerializer(serializers.ModelSerializer):
    """
    Serializes a single changeover event.
    This is for the "details" array in your sampleData.
    """
    # 1. We're RENAMING fields from our database (like 'current_recipe')
    #    to match your frontend's JSON (like 'material').
    material = serializers.CharField(source='current_recipe')
    from_recipe = serializers.CharField(source='previous_recipe')
    to_recipe = serializers.CharField(source='current_recipe')
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
            'from_recipe',
            'to_recipe',
            'start_time',
            'Std',
            'act',
            'static',
            'ramp',
            'shoot',
            'overshoot_category',
            'overshoot_reason',
            'remarks',
            'production_date',
            'shift'
        ]

    def get_shoot(self, obj):
        """
        Calculates Shoot = Actual Time - Standard Time
        """
        if obj.setup_time_actual is not None and obj.standard_time is not None:
            shoot_value = obj.setup_time_actual - obj.standard_time
            return round(shoot_value, 2)
        return None

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Map null stat values to "NA"
        stats_fields = ['Std', 'act', 'static', 'ramp', 'shoot']
        for field in stats_fields:
            if representation.get(field) is None:
                representation[field] = "NA"
                
        return representation

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

