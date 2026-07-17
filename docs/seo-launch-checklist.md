# SEO launch checklist

Use this after the production domain and SSL are working.

1. Open Google Search Console and add a **Domain property** for `apexgloballogistics.net`.
2. Copy the complete `google-site-verification=...` value Google provides.
3. In Spaceship DNS, add a TXT record with host `@` and paste that complete value. Keep existing SPF, DKIM, and DMARC records.
4. Wait for DNS propagation, then select **Verify** in Search Console. Domain verification does not require an app deployment.
5. If you choose a **URL-prefix property** instead, copy only the token from Google's HTML meta tag and set it as `GOOGLE_SITE_VERIFICATION` in `.env.production`, then rebuild the app container.
6. Confirm that `https://apexgloballogistics.net/robots.txt` and `https://apexgloballogistics.net/sitemap.xml` both load without signing in.
7. In Search Console, submit `sitemap.xml` under **Indexing > Sitemaps**. Remove and resubmit an older failed entry after the latest deployment if needed.
8. Use **URL inspection** for the home page, select **Test live URL**, and request indexing after the test succeeds.
9. Repeat URL inspection for the main service pages. Google decides when to crawl and index; submission is not an instant ranking guarantee.
10. Create or claim the business profile and keep the legal name, website, support email, address, phone, and registration details consistent and verifiable.
11. Collect only genuine reviews from real customers using neutral invitations.

Never buy fake reviews. Use Trustpilot or Google review invitations only for customers who actually used the service.
