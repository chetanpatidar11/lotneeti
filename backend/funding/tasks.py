from celery import shared_task

from funding.recurring import post_due_recurring_debits


@shared_task
def run_due_recurring_debits() -> int:
    return post_due_recurring_debits()
