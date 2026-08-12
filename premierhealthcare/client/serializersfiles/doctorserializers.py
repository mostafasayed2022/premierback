from rest_framework import serializers
from client.models import DoctorAvailability, Doctor, Branch ,CustomUser , Role , Service , Booking
from django.db import transaction
from .placeserializers import EntityImageMixin

class DoctorAvailabilityWriteSerializer(serializers.ModelSerializer):
    doctor  = serializers.PrimaryKeyRelatedField(queryset=Doctor.objects.all())
    branch  = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())
    weekday = serializers.ChoiceField(choices=DoctorAvailability._meta.get_field("weekday").choices)

    class Meta:
        model  = DoctorAvailability
        fields = ["doctor", "branch", "weekday", "start_time", "end_time", "slot_duration_minutes"]


# ── Nested write serializer (no doctor, used inside DoctorSerializer) ─
class DoctorAvailabilityNestedSerializer(serializers.ModelSerializer):
    branch  = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())
    weekday = serializers.ChoiceField(choices=DoctorAvailability._meta.get_field("weekday").choices)

    class Meta:
        model  = DoctorAvailability
        fields = ["branch", "weekday", "start_time", "end_time", "slot_duration_minutes"]

class DoctorAvailabilityReadSerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = DoctorAvailability
        fields = [
            'id',
            'weekday_display',          # e.g. "Monday"
            'start_time',
            'end_time',
            'slot_duration_minutes',
            'branch_name',              # e.g. "Main Clinic"
        ]
class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField(read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = DoctorAvailability
        fields = [
            "id", "doctor", "doctor_name", "branch", "branch_name",
            "weekday", "start_time", "end_time", "slot_duration_minutes"
        ]

    def get_doctor_name(self, obj):
        if obj.doctor and obj.doctor.user:
            full_name = obj.doctor.user.get_full_name().strip()
            return full_name if full_name else obj.doctor.user.username
        return f"Doctor #{obj.doctor_id}"




# Doctor serializers in admin

# class DoctorSerializer(EntityImageMixin,serializers.ModelSerializer):
#     user = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.filter(role=Role.DOCTOR))
#     name = serializers.CharField(source="user.get_full_name", read_only=True)
#     branches = serializers.PrimaryKeyRelatedField(
#     queryset=Branch.objects.all(), many=True, required=False
# )
#     services = serializers.PrimaryKeyRelatedField(
#     queryset=Service.objects.all(), many=True, required=False
# )


#     # Readable nested table
#     availabilities = DoctorAvailabilityReadSerializer(many=True, read_only=True)
#     # Write-only input (same as before)
    

#     class Meta:
#         model = Doctor
#         fields = [
#             "id", "user", "name", "specialization", "bio", "license_number",
#              "availabilities", "image_id", "image_url","branches","services"
#         ]

#     @transaction.atomic
#     def create(self, validated_data):
        
#         availabilities  = validated_data.pop("availabilities_write", [])
#         doctor = Doctor.objects.create(**validated_data)
        
#         for av in availabilities:
#             DoctorAvailability.objects.create(doctor=doctor, **av)
#             Doctor.objects.get_or_create(doctor=doctor, branch=av["branch"])
#         return doctor

#     @transaction.atomic
#     def update(self, instance, validated_data):
        
#         availabilities  = validated_data.pop("availabilities_write", None)

#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)
#         instance.save()

        
               

#         if availabilities is not None:
#             instance.availabilities.all().delete()
#             for av in availabilities:
#                 DoctorAvailability.objects.create(doctor=instance, **av)
#                 Doctor.objects.get_or_create(doctor=instance, branch=av["branch"])

#         return instance
from rest_framework import serializers

class CommaSeparatedPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """
    A PrimaryKeyRelatedField that accepts either:
      - A JSON array of PKs: [1, 2, 3]
      - A comma‑separated string: "1,2,3"
      - A single PK: 1
    Always outputs a list (many=True enforced).
    """
    def __init__(self, **kwargs):
        kwargs['many'] = True          # always many
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        if isinstance(data, str):
            data = data.strip()
            if not data:
                return []
            # Convert "1,2,3" → ["1","2","3"] then let parent parse
            data = [x.strip() for x in data.split(",") if x.strip()]
        elif isinstance(data, (int, float)):
            data = [data]   # single PK
        elif not isinstance(data, list):
            self.fail('not_a_list', input_type=type(data).__name__)
        return super().to_internal_value(data)

    def to_representation(self, value):
        # For read, return the list of PKs (default behavior)
        return super().to_representation(value)
class DoctorAvailabilityInputSerializer(serializers.Serializer):
    """Matches the fields you need when sending availabilities."""
    branch = serializers.IntegerField()
    weekday = serializers.CharField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    slot_duration_minutes = serializers.IntegerField(default=30)


class DoctorSerializer(EntityImageMixin, serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role=Role.DOCTOR)
    )
    name = serializers.CharField(source="user.get_full_name", read_only=True)

    # M2M fields – the admin can send proper JSON arrays now
    branches = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), many=True, required=False
    )
    services = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), many=True, required=False
    )

    # Read‑only nested availabilities (to see them in detail views)
    availabilities = DoctorAvailabilityReadSerializer(many=True, read_only=True)

    # Write‑only input for availability data
    

    class Meta:
        model = Doctor
        fields = [
            "id", "user", "name", "specialization", "position", "bio", "license_number",
            "experience", "patients", "languages",
            "branches", "services",                     # M2M
            "availabilities",  # availability
            "image_id", "image_url"                  # from EntityImageMixin
        ]
        read_only_fields = ["id"]

    @transaction.atomic
    def create(self, validated_data):
        # Pop M2M fields first – DRF's ModelSerializer will not handle them
        # automatically when create() is overridden, so we do it ourselves.
        branches_ids = validated_data.pop('branches', [])
        services_ids = validated_data.pop('services', [])
        availabilities_data = validated_data.pop('availabilities', [])

        # image_id is part of validated_data and handled by EntityImageMixin
        doctor = super().create(validated_data)

        # Set M2M
        if branches_ids:
            doctor.branches.set(branches_ids)
        if services_ids:
            doctor.services.set(services_ids)

        # Create availabilities
        for av in availabilities_data:
            branch_id = av.pop('branch')
            DoctorAvailability.objects.create(
                doctor=doctor,
                branch_id=branch_id,
                **av
            )
        return doctor

    @transaction.atomic
    def update(self, instance, validated_data):
        branches_ids = validated_data.pop('branches', None)
        services_ids = validated_data.pop('services', None)
        availabilities_data = validated_data.pop('availabilities', None)

        # Let the parent handle all regular fields (including image via mixin)
        instance = super().update(instance, validated_data)

        # M2M
        if branches_ids is not None:
            instance.branches.set(branches_ids)
        if services_ids is not None:
            instance.services.set(services_ids)

        # Replace availabilities if new data is provided
        if availabilities_data is not None:
            instance.availabilities.all().delete()
            for av in availabilities_data:
                branch_id = av.pop('branch')
                DoctorAvailability.objects.create(
                    doctor=instance,
                    branch_id=branch_id,
                    **av
                )
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Make sure M2M fields are serialised as arrays in read output
        data['branches'] = list(instance.branches.values_list('id', flat=True))
        data['services'] = list(instance.services.values_list('id', flat=True))
        return data
# class DoctorServiceSerializer(EntityImageMixin,serializers.ModelSerializer):
#     class Meta:
#         model = DoctorService
#         fields = ["id", "service", "fee_override","image_id", "image_url"]   # removed 'doctor'
#         read_only_fields = ["id"]                    # id is auto-generated


class DoctorPublicSerializer(EntityImageMixin, serializers.ModelSerializer):
    # Accept strings like "1,2" or "1" for ManyToMany fields
    branch = serializers.CharField(write_only=True, required=False)
    service = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Doctor
        fields = [
            "id", "user", "specialization", "position", "license_number",
            "experience", "patients", "languages",
            "image_id", "image_url", "bio",
            "branch", "service",
        ]
        read_only_fields = ["id"]

    def validate_branches(self, value):
        return self._parse_id_list(value)

    def validate_services(self, value):
        return self._parse_id_list(value)

    def _parse_id_list(self, value):
        """Convert string "1,2,3" or "1" to list of ints."""
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return []
            try:
                return [int(x.strip()) for x in value.split(",") if x.strip()]
            except ValueError:
                raise serializers.ValidationError("IDs must be integers.")
        elif isinstance(value, list):
            return value
        raise serializers.ValidationError("Invalid format.")

    def create(self, validated_data):
        branches_ids = validated_data.pop('branches', [])
        services_ids = validated_data.pop('services', [])
        doctor = super().create(validated_data)
        if branches_ids:
            doctor.branches.set(branches_ids)
        if services_ids:
            doctor.services.set(services_ids)
        return doctor

    def update(self, instance, validated_data):
        branches_ids = validated_data.pop('branches', None)
        services_ids = validated_data.pop('services', None)
        instance = super().update(instance, validated_data)
        if branches_ids is not None:
            instance.branches.set(branches_ids)
        if services_ids is not None:
            instance.services.set(services_ids)
        return instance

    def to_representation(self, instance):
        """Return the M2M fields as arrays in read responses."""
        data = super().to_representation(instance)
        data['branches'] = list(instance.branches.values_list('id', flat=True))
        data['services'] = list(instance.services.values_list('id', flat=True))
        return data


# client/serializers.py (or wherever doctor serializers live)


from client.models import Doctor

class DoctorProfileAvailabilityReadSerializer(serializers.ModelSerializer):
    weekday = serializers.CharField(read_only=True)
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)
    startTime = serializers.TimeField(source='start_time', read_only=True)
    endTime = serializers.TimeField(source='end_time', read_only=True)
    start_time = serializers.TimeField(read_only=True)
    end_time = serializers.TimeField(read_only=True)
    slotDurationMinutes = serializers.IntegerField(source='slot_duration_minutes', read_only=True)
    slot_duration_minutes = serializers.IntegerField(read_only=True)
    branchName = serializers.CharField(source='branch.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    branchId = serializers.IntegerField(source='branch.id', read_only=True)
    branch_id = serializers.IntegerField(source='branch.id', read_only=True)

    class Meta:
        model = DoctorAvailability
        fields = [
            'id', 'weekday', 'weekday_display', 'startTime', 'endTime', 'start_time', 'end_time',
            'slotDurationMinutes', 'slot_duration_minutes', 'branchName', 'branch_name', 'branchId', 'branch_id'
        ]

class DoctorProfileAvailabilityWriteSerializer(serializers.ModelSerializer):
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())
    weekday = serializers.ChoiceField(choices=DoctorAvailability._meta.get_field("weekday").choices)

    class Meta:
        model = DoctorAvailability
        fields = ["branch", "weekday", "start_time", "end_time", "slot_duration_minutes"]
# class DoctorProfileSerializer(EntityImageMixin,serializers.ModelSerializer):
#     # Direct mappings with source and camelCase names
#     userId = serializers.IntegerField(source='user.id', read_only=True)
#     name = serializers.CharField(source='user.get_full_name', read_only=True)
#     firstName = serializers.CharField(source='user.first_name', read_only=True)
#     lastName = serializers.CharField(source='user.last_name', read_only=True)
#     email = serializers.EmailField(source='user.email', read_only=True)
#     specialty = serializers.CharField(source='specialization', read_only=True)
#     bio = serializers.CharField(read_only=True)
#     licenseNumber = serializers.CharField(source='license_number', read_only=True)
#     photo = serializers.SerializerMethodField()  # image_url → photo

#     # Readable names for branches and services (string arrays)
#     branches = serializers.SerializerMethodField()
#     services = serializers.SerializerMethodField()

#     # Nested availabilities
#     availability = DoctorProfileAvailabilityReadSerializer(many=True, read_only=True)
#     # Optional legacy fields (can be filled later)

#     class Meta:
#         model = Doctor
#         fields = [
#             'id', 'userId', 'name', 'firstName', 'lastName', 'email',
#             'specialty', 'bio', 'licenseNumber',"image_id", "image_url"  ,
#             'branches', 'services', 'availability',"photo"
#             ]

#     def get_photo(self, obj):
#         if obj.image:
#             url = obj.image.file.url
#             request = self.context.get('request')
#             if request:
#                 return request.build_absolute_uri(url)
#             return url
#         return None

#     def get_branches(self, obj):
#         return list(obj.branches.values_list('name', flat=True))

#     def get_services(self, obj):
#         return list(obj.services.values_list('name', flat=True))



########################################
class DoctorProfileDetailSerializer(serializers.ModelSerializer):
    # These names match the ApiDoctorProfile interface
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
  
   
    
    image_url = serializers.SerializerMethodField()

    # Branches & services as arrays of names
    branches_names = serializers.SerializerMethodField()
    services_names = serializers.SerializerMethodField()

    # Availabilities (snake_case inner fields)
    

    class Meta:
        model = Doctor
        fields = [
            'id', 'first_name', 'last_name', 'name', 'email',
            'specialization', 'bio', 'license_number', 'image_url',
            'branches_names', 'services_names'
        ]

    def get_image_url(self, obj):
        if obj.image:
            url = obj.image.file.url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_branches_names(self, obj):
        return list(obj.branches.values_list('name', flat=True))

    def get_services_names(self, obj):
        return list(obj.services.values_list('name', flat=True))



class DoctorProfileDetailSerializer(serializers.ModelSerializer):
    # identity fields (snake_case)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
   
    image_url = serializers.SerializerMethodField()

    # arrays of names and details
    branches_names = serializers.SerializerMethodField()
    branches_detail = serializers.SerializerMethodField()
    services_names = serializers.SerializerMethodField()

    # the schedule
    availabilities = DoctorProfileAvailabilityReadSerializer(many=True, read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'first_name', 'last_name', 'name', 'email',
            'specialization', 'position', 'bio', 'license_number', 'image_url',
            'experience', 'patients', 'languages',
            'branches_names', 'branches_detail', 'services_names', 'availabilities',
        ]

    def get_image_url(self, obj):
        if obj.image:
            url = obj.image.file.url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_branches_names(self, obj):
        return list(obj.branches.values_list('name', flat=True))

    def get_branches_detail(self, obj):
        branches = obj.branches.all()
        if not branches.exists():
            from client.models import Branch
            branches = Branch.objects.filter(is_active=True)
        return list(branches.values('id', 'name', 'city'))

    def get_services_names(self, obj):
        return list(obj.services.values_list('name', flat=True))




class DoctorProfileBookingSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    patient_phone = serializers.CharField(source='patient.phone_number', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'patient_name', 'patient_phone', 'service_name', 'branch_name',
            'date', 'start_time', 'end_time', 'status', 'fee', 'notes',
        ]
        read_only_fields = fields  # this serializer is read-only, used only for display


class DoctorProfileBookingUpdateSerializer(serializers.ModelSerializer):
    """
    Doctor can ONLY change date/start_time/end_time of a booking.
    status, fee, patient, service, branch are never touched here.
    """
    class Meta:
        model = Booking
        fields = ['date', 'start_time', 'end_time']

    def validate(self, attrs):
        if attrs['start_time'] >= attrs['end_time']:
            raise serializers.ValidationError("start_time must be before end_time.")
        return attrs
