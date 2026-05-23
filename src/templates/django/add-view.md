---
name: add-view
description: Add a Django view with URL routing and an associated template.
premium: false
order: 30
applies_when:
  framework: django
---
---
description: Scaffold a Django view
argument-hint: <view-name>
---

Add a Django view for $ARGUMENTS.

1. Decide: function-based view or class-based? Match the existing convention in this app — don't mix unnecessarily.
2. Put the view in the right app's `views.py`. If this is a brand-new domain, start a new app via `python manage.py startapp <name>`.
3. Add the URL pattern to the app's `urls.py` with a descriptive `name=` for `reverse()` lookups.
4. Add a template at `templates/<app>/<view>.html`. Extend the base template the rest of the app uses.
5. If the view requires login, use `@login_required` (FBV) or `LoginRequiredMixin` (CBV). Don't reinvent auth checks.
6. If the view handles a form, validate with a `forms.Form` or `forms.ModelForm` — never read `request.POST` directly into a model.
7. Run `python manage.py check` and confirm zero issues.
8. Add a test in the app's `tests.py` that exercises GET (and POST if it accepts one) via the test client.

Static files: if you reference new CSS/JS, put them under `static/<app>/` and run `python manage.py collectstatic` if production-relevant.
