# EstateHub demo accounts

Development and demo environments only. These credentials are deliberately recorded in this repository; do not use them for real accounts or production data.

From the server directory, run `npm run prisma:seed` against a development database. Seeding is explicit; starting the API does not create these accounts. Each account uses email/password sign-in and has its own unique password.

| Role | Email | Password |
| --- | --- | --- |
| Tenant | tenant01@estatehub.test | 701IszU_PDhdJ8Y3gaMfA_E3 |
| Tenant | tenant02@estatehub.test | rehew8iVi8OZ_E5-NOi92qdw |
| Tenant | tenant03@estatehub.test | E_KQ2n-gc6_bJ6DWkSeHEF-y |
| Tenant | tenant04@estatehub.test | Aa28ocxNfxYuIuxJ4ydqI6Aa |
| Tenant | tenant05@estatehub.test | pZREACDlFdLZCetda9bAfl41 |
| Tenant | tenant06@estatehub.test | lhvMHfdb5w0AorV-AxBOT0vS |
| Tenant | tenant07@estatehub.test | AzyN9VnkJQ1loI3smbMlFeQU |
| Tenant | tenant08@estatehub.test | 8vo0Gw5qQP6aQQbMpQgmY2iJ |
| Tenant | tenant09@estatehub.test | T5dytGSBTbgkwPRt7lrMSPII |
| Tenant | tenant10@estatehub.test | 1NcPzp7qW4WSBPbdpfK5qIP9 |
| Tenant | tenant11@estatehub.test | YrM6TeXV8fLO5ZZ3VHFnmC-k |
| Tenant | tenant12@estatehub.test | 9V-f0HiNzmMzFtWGsPE6MYDc |
| Tenant | tenant13@estatehub.test | u3kWbMc1b-lsfH6C6y8kALzb |
| Tenant | tenant14@estatehub.test | rU2q8wwOF1I_u7vabW3X8E2u |
| Tenant | tenant15@estatehub.test | MOvZT6thhQ1d3MrlDbgHuUbZ |
| Manager | manager01@estatehub.test | zirUcarXH5dsaSETk8Zih2VL |
| Manager | manager02@estatehub.test | ADwe0b5H1_eDkFLQS19_-gn1 |
| Manager | manager03@estatehub.test | HQV1T2EFdAId7nLO7f047PTQ |
| Manager | manager04@estatehub.test | PtVwvTGjNlFJ6cHWoW4h77n1 |
| Manager | manager05@estatehub.test | CZ7Lxq4McHKLEmBqjDAXLnvm |
| Manager | manager06@estatehub.test | 9NBREZ8Sm49r0pTsSiAfpmJb |
| Manager | manager07@estatehub.test | va0s-GO9TK6Dc-0d2249BfIw |
| Manager | manager08@estatehub.test | fLMXdjfT1GWncbAzM1jJ1Sxe |
| Manager | manager09@estatehub.test | Wvdk5AathSumy9ZfqUaqcR0l |
| Manager | manager10@estatehub.test | aBRXlmj8iOffcJnDr5C9M7WV |

The fixture stores bcrypt hashes, not these plain-text passwords. If you change a password here, update its hash in `seedData/account.json` too. Run `node --test tests/seed-data.test.cjs` to verify that all 25 pairs match.
