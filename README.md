# squatch

## Cloudflare hosting

The migration preserves Heroku source `548151cf393768f16e3b884fde8bd0e768b24e02`
and its private slug recovery copy. Cloudflare native Git builds own publication
from `main`, using `npm run build` and `npm run deploy`. Deployment credentials stay
in Cloudflare. The original Python requirements remain in `heroku-recovery/`.

Workers Static Assets preserve `/`, `/freematic`, `/faucet`, `/casino`, `/squatches`
and existing static URLs. The Worker preserves `/login`, `/lounge`, `/squatch_club`,
contract addresses and strict thresholds. The unused SQLAlchemy User model had no
application writers; sessions are cookies. There is no application database to
transfer. Unknown paths return real 404s; private responses and the release marker
use `Cache-Control: no-store`.

The current ethers browser adapter requires the CONNECT WALLET button before
requesting accounts. It retains the CTF's 600-second signed-message protocol and
15-minute HS256 access-cookie interface. This protocol permits signature reuse
within a time bucket, as before. Preserve the original CTF session issuer value
privately in `SESSION_SECRET` to keep current cookies compatible; it was already
public in the historical source. Store the old `web3` URL as `RPC_URL` and retain
`FLAG200`, `FLAG300`, `FLAG400`, `FLAG500` as Cloudflare secrets. Never log their
values. The backend performs only `eth_call`; the existing browser transaction
buttons remain available to the site owner/users.

Staging has a distinct AUTH_DOMAIN and session secret, without production RPC or
FLAG values. Run `npm ci`, `npm test` and `npm run check:deploy`; tests use ephemeral
wallets and synthetic RPC responses, with no financial transactions. The browser
and Worker both use pinned ethers 6.17.0; the locked npm graph audits clean.

Before cutover, inspect the exact native commit/build/active version separately
from HTTPS and browser behavior. Keep the retained Heroku destination DNS record
and attach an ordinary proxied Worker route only after staging is verified. Leave
Heroku auto deploys disabled and scale its web process to zero after the custom
host works. Permanent deletion remains outside this migration.

forked from simple-flask-metamask

# simple-flask-metamask
simple flask+metamask integration example

Live demo here: https://simple-flask-metamask.herokuapp.com/

Useful sources:

https://www.toptal.com/ethereum/one-click-login-flows-a-metamask-tutorial

https://ethereum.stackexchange.com/questions/35486/how-to-verify-metamask-account-holder-is-the-real-owner-of-the-address

https://web3py.readthedocs.io/en/stable/web3.eth.account.html

https://flask-jwt-extended.readthedocs.io/en/stable/basic_usage/

https://flask-jwt-extended.readthedocs.io/en/stable/tokens_in_cookies/

https://ethereum.stackexchange.com/questions/36790/how-to-view-custom-token-balance-in-ether-wallet-using-web3

