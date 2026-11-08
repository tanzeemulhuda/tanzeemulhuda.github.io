#Tanzeemul Huda Madrasa HR & Payroll

A lightweight React and TypeScript prototype for the HR workflows:

- Daily staff attendance with date selection and optional automatic `On Leave`
  status for approved leave dates.
- Employee advances and loans with repayment tracking and monthly deduction
  references.
- Institute investment borrowing with principal and interest payments tracked
  separately.

Records are saved in this browser's local storage. This is a front-end demo;
it has no shared database, authentication, or automatic payroll integration.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Publish on GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys the site
whenever changes are pushed to `main`, or when started manually from the
Actions tab. In the repository's **Settings → Pages**, set the build and
deployment source to **GitHub Actions**.

After the first successful workflow run, open the repository's **Settings →
Pages** page to see the published site URL. The app uses relative asset paths
so it also works when published from a repository subpath.
