from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Promote a user to admin (is_staff=True)'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user to promote')

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            user = User.objects.get(email=email)
            user.is_staff = True
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully promoted {email} to admin')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User with email {email} not found')
            )
