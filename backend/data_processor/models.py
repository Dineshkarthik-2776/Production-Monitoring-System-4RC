from django.db import models

# Create your models here.
class RawLineData(models.Model) :
    """
    This model is associated with the 4RC table where actual Line Data read by sensors are stored.
    """

    id = models.BigAutoField(primary_key=True, db_column='id')
    machine_id = models.CharField(max_length=8, db_column='MachineID', null=True, blank=True)
    recipe_code = models.CharField(max_length=50, db_column='RecipeCode', null=True, blank=True)
    line_speed_actual = models.FloatField(db_column='LineSpeedActual', null=True, blank=True)
    line_speed_set = models.FloatField(db_column='LineSpeedSet', null=True, blank=True)
    timestamp = models.DateTimeField(db_column='TimeStamp')
    date_created = models.DateTimeField(db_column='DateCreated')
    processed_flag = models.BooleanField(default=False, db_column='ProcessedFlag')
    status = models.CharField(max_length=50, null=True, blank=True, db_column='Status')
    class Meta:
        managed = False
        db_table = 'FRC'
        ordering = ['timestamp']


class MaterialMaster(models.Model):
    """
    External BOM table containing recipes and SAP codes
    """
    recipe_code = models.CharField(max_length=100, primary_key=True, db_column='recipe_code')
    sap_code = models.CharField(max_length=100, null=True, blank=True, db_column='sap_code')

    class Meta:
        managed = False
        db_table = 'MaterialMaster'


class RecipeMaster(models.Model):
    """
       This model stores the target speed and recipe type
    """
    recipe_code = models.CharField(max_length=100, unique=True, primary_key=True)
    sap_code = models.CharField(max_length=100, null=True, blank=True)
    target_speed = models.FloatField()
    recipe_type = models.CharField(max_length=50, help_text="e.g., 'Steel' or 'Fabric'")

    class Meta:
        db_table = 'RecipeMaster'


class ChangeoverSummary(models.Model):
    """
    Processed Data which contains important statistics are stored in this Model
    """

    class OvershootCategory(models.TextChoices):
        MECHANICAL = 'Mechanical', 'Mechanical'
        ELECTRICAL = 'Electrical', 'Electrical'
        OPERATIONAL = 'Operational', 'Operational'
        MATERIAL = 'Material', 'Material'
        OTHER = 'Other', 'Other'
        NONE = 'None', 'None'

    batch = models.FloatField(unique=True)
    recipe_change_time = models.DateTimeField(null=True, blank=True)
    current_recipe = models.TextField(null=True, blank=True)
    previous_recipe = models.TextField(null=True, blank=True)
    ramp_down_timestamp = models.DateTimeField(db_column='ramp_down', null=True, blank=True)
    setup_start_timestamp = models.DateTimeField(db_column='setup_start', null=True, blank=True)
    ramp_up_timestamp = models.DateTimeField(db_column='ramp_up', null=True, blank=True)
    setup_complete_timestamp = models.DateTimeField(db_column='setup_complete', null=True, blank=True)

    # --- Calculated Values ---
    ramp_up_time_loss = models.FloatField(null=True, blank=True)
    ramp_down_time_loss = models.FloatField(null=True, blank=True)

    # --- Values for Frontend ---
    setup_time_actual = models.FloatField(db_column='setup_time_act', null=True, blank=True)
    standard_time = models.BigIntegerField(null=True, blank=True)

    # --- CRITICAL NEW FIELDS (for 'static' and 'ramp') ---
    static_setup_time = models.FloatField(null=True, blank=True)
    ramp_up_time = models.FloatField(null=True, blank=True)

    # --- Classification ---
    current_type = models.TextField(null=True, blank=True)
    previous_type = models.TextField(null=True, blank=True)
    change_over_type = models.TextField(db_column='change_over', null=True, blank=True)

    overshoot_category = models.CharField(
        max_length=50,
        choices=OvershootCategory.choices,
        null=True,
        blank=True,
        default=OvershootCategory.NONE  # Set a default
    )
    overshoot_reason = models.TextField(null=True, blank=True, default=None)
    remarks = models.TextField(null=True, blank=True)
    production_date = models.DateField(null=True, blank=True)
    shift = models.CharField(max_length=1, null=True, blank=True)

    class Meta:
        db_table = 'ChangeoverSummary'
        ordering = ['-recipe_change_time']


class ChangeoverCorrectionRequest(models.Model):
    """
    Stores requests from workers to update a ChangeoverSummary reason/category
    when the 5-hour window has passed.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    changeover = models.ForeignKey(ChangeoverSummary, on_delete=models.CASCADE, related_name='correction_requests')
    requested_by = models.ForeignKey('user_authentication.User', on_delete=models.CASCADE)
    
    # Store old values (snapshot)
    old_category = models.CharField(max_length=50, null=True, blank=True)
    old_reason = models.TextField(null=True, blank=True)
    
    # Store new requested values
    new_category = models.CharField(max_length=50, choices=ChangeoverSummary.OvershootCategory.choices)
    new_reason = models.TextField()
    
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.PENDING
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ChangeoverCorrectionRequest'
        ordering = ['-created_at']


class StandardTimeMaster(models.Model):
    """
    This model stores standard setup times for different changeover types
    """
    changeover_key = models.CharField(max_length=100, unique=True, help_text="e.g., 'Steel to Steel'")
    standard_time = models.FloatField()

    class Meta:
        db_table = 'StandardTimeMaster'
