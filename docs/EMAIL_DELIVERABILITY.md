# Email deliverability

Apex sends transactional email from `info@apexgloballogistics.net` through SpaceMail SMTP. Inbox
placement is decided by the recipient's mail provider, so it cannot be guaranteed by application
code. Correct DNS authentication and a consistent sending reputation are required.

## Required DNS records

Keep exactly one SPF TXT record at the root:

```text
v=spf1 include:spf.spacemail.com ~all
```

Copy the unique `spacemail._domainkey` DKIM TXT value from SpaceMail Advanced DNS. Do not copy a
DKIM key from another domain.

Add this monitoring DMARC TXT record at `_dmarc`:

```text
v=DMARC1; p=none; rua=mailto:support@apexgloballogistics.net; adkim=s; aspf=s; pct=100
```

After SPF and DKIM pass consistently and DMARC reports show only approved senders, change the DMARC
policy to `p=quarantine`, then later to `p=reject`.

SpaceMail's DKIM value is unique to the domain. In Spaceship, open the domain's **Advanced DNS**,
find the inactive SpaceMail DKIM record, and copy the complete value beginning with `v=DKIM1; k=rsa;`
to the `spacemail._domainkey` TXT record. Do not substitute a DKIM value from another domain.

## Application monitoring

The health endpoint now performs a cached SMTP TLS and authentication probe. It reports the provider
and the most recent check time without exposing mailbox credentials:

```text
https://apexgloballogistics.net/api/health
```

Email Studio also shows this connection status alongside sent and failed email logs. A successful
SMTP probe proves the application can authenticate to SpaceMail; it cannot prove a recipient inbox
accepted a message. Use the Email Studio failure reason and a delivered Gmail message's **Show
original** view to verify recipient-level SPF, DKIM, and DMARC results.

## Operational checks

- Use `info@apexgloballogistics.net` consistently as the From address.
- Keep `support@apexgloballogistics.net` as Reply-To.
- Send registration, verification, reset, invoice, and shipment updates only after a real user or
  admin action.
- Avoid repeated test mail to unrelated recipients and avoid misleading urgency or payment language.
- In Gmail, open a delivered message, choose **Show original**, and confirm SPF, DKIM, and DMARC pass.
- New domains need normal sending history. Start with genuine transactional messages and increase
  volume gradually.
