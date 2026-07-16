require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');
const express = require('express');
const { authenticator } = require('otplib');

async function main() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log('In-memory MongoDB started');

  const app = express();

  app.use(require('helmet')());
  app.use(require('cors')({ origin: 'http://localhost:5173' }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  const authRoutes = require('./src/routes/auth');
  const orgRoutes = require('./src/routes/org');
  const deviceRoutes = require('./src/routes/devices');
  const { resolvePlanConfig } = require('./src/middleware/planResolver');
  const { lockdownGuard } = require('./src/middleware/lockdownGuard');

  app.use('/api/*', resolvePlanConfig);
  app.use('/api/*', lockdownGuard);
app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/plans', require('./src/routes/plans'));

  const server = http.createServer(app);
  server.listen(4000, () => {
    console.log('Server on :4000');
    runTests().finally(async () => {
      server.close();
      await mongoose.disconnect();
      await mongod.stop();
    });
  });

  function req(method, path, body, token) {
    return new Promise((resolve, reject) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = 'Bearer ' + token;
      const opts = { hostname: 'localhost', port: 4000, path, method, headers };
      const r = http.request(opts, (res) => {
        let d = '';
        res.on('data', (c) => d += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, body: d }); }
        });
      });
      r.on('error', reject);
      if (body) r.write(JSON.stringify(body));
      r.end();
    });
  }

  async function runTests() {
    let passed = 0;
    let failed = 0;

    function ok(label, condition) {
      if (condition) { passed++; console.log('  \u2713 ' + label); }
      else { failed++; console.log('  \u2717 ' + label + ' FAILED'); }
    }

    console.log('\n=== E2E API Tests ===\n');

    // 1. Health check
    console.log('1. Health check');
    const health = await req('GET', '/health');
    ok('returns 200', health.status === 200);
    ok('returns {status:ok}', health.body.status === 'ok');

    // 2. Register
    console.log('\n2. Register user');
    const reg = await req('POST', '/api/auth/register', { email: 'e2e@test.com', password: 'test123456' });
    ok('returns 201', reg.status === 201);
    ok('returns token', !!reg.body.token);
    ok('returns user object', !!reg.body.user);
    ok('user has email', reg.body.user?.email === 'e2e@test.com');
    ok('user has role', !!reg.body.user?.role);
    ok('user role is owner', reg.body.user?.role === 'owner');
    ok('user has organization', !!reg.body.user?.organization);
    const token = reg.body.token;

    if (!token) {
      console.log('\nNo token — skipping authenticated tests.');
      server.close();
      return;
    }

    // 3. Get Me
    console.log('\n3. GET /auth/me');
    const me = await req('GET', '/api/auth/me', null, token);
    ok('returns 200', me.status === 200);
    ok('returns user', !!me.body.user);
    ok('email matches', me.body.user?.email === 'e2e@test.com');

    // 4. Get Org (auto-created on register)
    console.log('\n4. GET /api/org');
    const orgResp = await req('GET', '/api/org', null, token);
    ok('returns 200', orgResp.status === 200);
    ok('org has plan personal_free', orgResp.body.org?.plan === 'personal_free');

    // 5. Get Users (owner can list)
    console.log('\n5. GET /auth/users (owner)');
    const usersResp = await req('GET', '/api/auth/users', null, token);
    ok('returns 200', usersResp.status === 200);
    ok('returns users array', Array.isArray(usersResp.body.users));

    // 6. Get Devices (owner can list)
    console.log('\n6. GET /api/devices (owner)');
    const devResp = await req('GET', '/api/devices', null, token);
    ok('returns 200', devResp.status === 200);
    ok('returns devices array', Array.isArray(devResp.body.devices));

    // 7. Login
    console.log('\n7. Login');
    const login = await req('POST', '/api/auth/login', { email: 'e2e@test.com', password: 'test123456' });
    ok('returns 200', login.status === 200);
    ok('returns token', !!login.body.token);

    // 8. Duplicate registration
    console.log('\n8. Duplicate registration');
    const dup = await req('POST', '/api/auth/register', { email: 'e2e@test.com', password: 'xyz' });
    ok('returns 409', dup.status === 409);

    // 9. PUT /auth/profile — valid updates
    console.log('\n9. PUT /auth/profile — valid fields');
    const profile1 = await req('PUT', '/api/auth/profile', {
      assistantName: 'Jarvis',
      assistantVoice: 'nova',
      languagePreference: 'tr',
      keyboardShortcut: 'Ctrl+Shift+A',
      colorTheme: 'light_orange_black',
    }, token);
    ok('returns 200', profile1.status === 200);
    ok('returns updated user', !!profile1.body.user);
    ok('assistantName saved', profile1.body.user?.assistantName === 'Jarvis');
    ok('assistantVoice saved', profile1.body.user?.assistantVoice === 'nova');
    ok('language saved', profile1.body.user?.languagePreference === 'tr');
    ok('keyboardShortcut saved', profile1.body.user?.keyboardShortcut === 'Ctrl+Shift+A');
    ok('theme saved', profile1.body.user?.colorTheme === 'light_orange_black');

    // 9b. Verify persistence via /auth/me
    console.log('\n9b. Verify profile persists');
    const meAfter = await req('GET', '/api/auth/me', null, token);
    ok('assistantName persisted', meAfter.body.user?.assistantName === 'Jarvis');
    ok('language persisted', meAfter.body.user?.languagePreference === 'tr');
    ok('colorTheme persisted', meAfter.body.user?.colorTheme === 'light_orange_black');

    // 9c. Partial update — single field
    console.log('\n9c. Partial update');
    const partial = await req('PUT', '/api/auth/profile', { wakePhrase: 'Hey Deska' }, token);
    ok('returns 200', partial.status === 200);
    ok('wakePhrase saved', partial.body.user?.wakePhrase === 'Hey Deska');
    ok('assistantName still set', partial.body.user?.assistantName === 'Jarvis');

    // 9d. Clear a field by sending null
    console.log('\n9d. Clear field with null');
    const clear = await req('PUT', '/api/auth/profile', { wakePhrase: null }, token);
    ok('returns 200', clear.status === 200);
    ok('wakePhrase cleared', clear.body.user?.wakePhrase === null);

    // 9e. Invalid language
    console.log('\n9e. Invalid language');
    const badLang = await req('PUT', '/api/auth/profile', { languagePreference: 'fr' }, token);
    ok('returns 400 for bad language', badLang.status === 400);

    // 9f. Invalid theme
    console.log('\n9f. Invalid theme');
    const badTheme = await req('PUT', '/api/auth/profile', { colorTheme: 'dark_mode' }, token);
    ok('returns 400 for bad theme', badTheme.status === 400);

    // 9g. No valid fields
    console.log('\n9g. No valid fields');
    const noFields = await req('PUT', '/api/auth/profile', {}, token);
    ok('returns 400 for empty body', noFields.status === 400);

    // 9h. Unknown field ignored (whitelist)
    console.log('\n9h. Unknown fields ignored');
    const unknown = await req('PUT', '/api/auth/profile', { role: 'admin', passwordHash: 'evil', assistantName: 'StillJarvis' }, token);
    ok('returns 200 (ignores dangerous fields)', unknown.status === 200);
    ok('assistantName updated', unknown.body.user?.assistantName === 'StillJarvis');

    // 9i. Unauthenticated
    console.log('\n9i. Unauthenticated profile update');
    const noAuth = await req('PUT', '/api/auth/profile', { assistantName: 'Hack' }, null);
    ok('returns 401 without token', noAuth.status === 401);

    // 10. PUT /api/org — update organization
    console.log('\n10. PUT /api/org');
    const orgUpdate = await req('PUT', '/api/org', { name: 'Acme Corp' }, token);
    ok('returns 200', orgUpdate.status === 200);
    ok('name updated', orgUpdate.body.org?.name === 'Acme Corp');

    // 10b. Update feature flags
    console.log('\n10b. Update feature flags');
    const flagUpdate = await req('PUT', '/api/org', {
      featureFlags: { learningMode: false, remoteControl: true },
      reasoningProvider: 'gemini',
    }, token);
    ok('returns 200', flagUpdate.status === 200);
    ok('learningMode flipped', flagUpdate.body.org?.featureFlags?.learningMode === false);
    ok('remoteControl enabled', flagUpdate.body.org?.featureFlags?.remoteControl === true);
    ok('reasoningProvider gemini', flagUpdate.body.org?.reasoningProvider === 'gemini');

    // 10c. Update branding
    console.log('\n10c. Update branding');
    const brandingUpdate = await req('PUT', '/api/org', {
      branding: { displayName: 'ACME AI', defaultAssistantName: 'Ace' },
    }, token);
    ok('returns 200', brandingUpdate.status === 200);
    ok('branding displayName', brandingUpdate.body.org?.branding?.displayName === 'ACME AI');
    ok('branding assistant name', brandingUpdate.body.org?.branding?.defaultAssistantName === 'Ace');

    // 10d. Invalid provider
    console.log('\n10d. Invalid reasoning provider');
    const badProvider = await req('PUT', '/api/org', { reasoningProvider: 'openai' }, token);
    ok('returns 400 for invalid provider', badProvider.status === 400);

    // 10e. Verify persistence via GET
    console.log('\n10e. Verify org persisted');
    const orgAfter = await req('GET', '/api/org', null, token);
    ok('name persisted', orgAfter.body.org?.name === 'Acme Corp');
    ok('flag persisted', orgAfter.body.org?.featureFlags?.learningMode === false);

    // 11. Invite user, then offboard
    console.log('\n11. Invite user for offboarding');
    const invited = await req('POST', '/api/auth/invite', { email: 'temp@test.com', role: 'employee' }, token);
    ok('returns 201', invited.status === 201);
    const invitedUserId = invited.body.user?._id;
    ok('invited user has id', !!invitedUserId);

    // 11b. Offboard the invited user
    console.log('\n11b. Offboard invited user');
    const offboard = await req('POST', '/api/auth/offboard', { email: 'temp@test.com' }, token);
    ok('returns 200', offboard.status === 200);
    ok('user offboarded', offboard.body.user?.offboarded === true);

    // 11c. Cannot offboard self
    console.log('\n11c. Cannot offboard self');
    const selfOffboard = await req('POST', '/api/auth/offboard', { email: 'e2e@test.com' }, token);
    ok('returns 400 for self-offboard', selfOffboard.status === 400);

    // 11d. Offboarded user cannot login
    console.log('\n11d. Offboarded user cannot login');
    const offboardedLogin = await req('POST', '/api/auth/login', { email: 'temp@test.com', password: 'test123456' });
    ok('returns 401 for offboarded user', offboardedLogin.status === 401);

    // 12. MFA disable — requires password
    console.log('\n12. MFA disable (not enabled)');
    const mfaDisable = await req('POST', '/api/auth/mfa/disable', { password: 'test123456' }, token);
    ok('returns 400 when MFA not enabled', mfaDisable.status === 400);

    // 12b. MFA disable — setup MFA with real TOTP
    console.log('\n12b. MFA disable — setup MFA first');
    const mfaSetup = await req('POST', '/api/auth/mfa/setup', {}, token);
    ok('MFA setup returns 200', mfaSetup.status === 200);
    const mfaSecret = mfaSetup.body.secret;
    ok('MFA setup returns secret', !!mfaSecret);

    const validTOTP = authenticator.generate(mfaSecret);
    const mfaVerify = await req('POST', '/api/auth/mfa/verify', { token: validTOTP }, token);
    ok('MFA verify succeeds', mfaVerify.status === 200);

    // 12c. Wrong password
    console.log('\n12c. MFA disable — wrong password');
    const wrongPw = await req('POST', '/api/auth/mfa/disable', { password: 'wrong' }, token);
    ok('returns 401 for wrong password', wrongPw.status === 401);

    // 12d. Correct password
    console.log('\n12d. MFA disable — correct password');
    const disableOk = await req('POST', '/api/auth/mfa/disable', { password: 'test123456' }, token);
    ok('returns 200 with correct password', disableOk.status === 200);
    ok('MFA disabled message', disableOk.body.message?.includes('disabled'));

    // 12e. Verify MFA disabled
    console.log('\n12e. Verify MFA disabled');
    const meFinal = await req('GET', '/api/auth/me', null, token);
    ok('mfaEnabled is false', meFinal.body.user?.mfaEnabled === false);

    // 13. Lockdown — activate
    console.log('\n13. Lockdown — activate');
    const lockOn = await req('PUT', '/api/org', { lockdownActive: true }, token);
    ok('lockdown activated', lockOn.body.org?.lockdownActive === true);

    // 13b. Writes blocked during lockdown
    console.log('\n13b. Writes blocked during lockdown');
    const blockedProfile = await req('PUT', '/api/auth/profile', { assistantName: 'Nope' }, token);
    ok('PUT /auth/profile blocked (403)', blockedProfile.status === 403);

    const blockedInvite = await req('POST', '/api/auth/invite', { email: 'blocked@test.com', role: 'employee' }, token);
    ok('POST /auth/invite blocked (403)', blockedInvite.status === 403);

    // 13c. Reads still work during lockdown
    console.log('\n13c. Reads still work during lockdown');
    const readMe = await req('GET', '/api/auth/me', null, token);
    ok('GET /auth/me still works (200)', readMe.status === 200);

    const readOrg = await req('GET', '/api/org', null, token);
    ok('GET /api/org still works (200)', readOrg.status === 200);

    // 13d. Unauthenticated writes still work (login/register)
    console.log('\n13d. Unauthenticated writes during lockdown');
    const lockLogin = await req('POST', '/api/auth/login', { email: 'e2e@test.com', password: 'test123456' });
    ok('POST /auth/login still works (200)', lockLogin.status === 200);

    // 13e. Lockdown — deactivate
    console.log('\n13e. Lockdown — deactivate');
    const lockOff = await req('PUT', '/api/org', { lockdownActive: false }, token);
    ok('lockdown deactivated', lockOff.body.org?.lockdownActive === false);

    // 13f. Writes work again after lockdown
    console.log('\n13f. Writes work after lockdown');
    const afterLock = await req('PUT', '/api/auth/profile', { assistantName: 'Free' }, token);
    ok('PUT /auth/profile works again (200)', afterLock.status === 200);
    ok('assistantName updated after lockdown', afterLock.body.user?.assistantName === 'Free');

    // 13g. Login still blocked for offboarded user during lockdown
    console.log('\n13g. Offboarded user still blocked');
    const offLogin = await req('POST', '/api/auth/login', { email: 'temp@test.com', password: 'test123456' });
    ok('offboarded login still returns 401', offLogin.status === 401);

    // 14. Invite + set-password flow
    console.log('\n14. Invite new user');
    const invite2 = await req('POST', '/api/auth/invite', { email: 'newbie@test.com', role: 'employee' }, token);
    ok('returns 201', invite2.status === 201);
    ok('returns user object', !!invite2.body.user);
    const setupToken = invite2.body.setupToken;
    ok('returns setupToken', !!setupToken);
    ok('invited user has no passwordHash (not returned)', invite2.body.user?.passwordHash === undefined);

    // 14b. Set password with valid token
    console.log('\n14b. Set password');
    const setPw = await req('POST', '/api/auth/set-password', {
      email: 'newbie@test.com',
      token: setupToken,
      password: 'newbie123',
    });
    ok('returns 200', setPw.status === 200);
    ok('returns JWT', !!setPw.body.token);
    ok('returns user', !!setPw.body.user);
    ok('user email matches', setPw.body.user?.email === 'newbie@test.com');
    const newbieToken = setPw.body.token;

    // 14c. Login as the new user
    console.log('\n14c. Login as new user');
    const newbieLogin = await req('POST', '/api/auth/login', { email: 'newbie@test.com', password: 'newbie123' });
    ok('returns 200', newbieLogin.status === 200);
    ok('returns token', !!newbieLogin.body.token);

    // 14d. New user can access /auth/me
    console.log('\n14d. New user GET /auth/me');
    const newbieMe = await req('GET', '/api/auth/me', null, newbieToken);
    ok('returns 200', newbieMe.status === 200);
    ok('email matches', newbieMe.body.user?.email === 'newbie@test.com');
    ok('role is employee', newbieMe.body.user?.role === 'employee');
    ok('mode is enterprise', newbieMe.body.user?.mode === 'enterprise');

    // 14e. Set password with reused token (should fail — token cleared)
    console.log('\n14e. Reused setup token fails');
    const reuseToken = await req('POST', '/api/auth/set-password', {
      email: 'newbie@test.com',
      token: setupToken,
      password: 'another123',
    });
    ok('returns 400 for reused token', reuseToken.status === 400);

    // 14f. Set password on user who already has one (double-setup guard)
    console.log('\n14f. Double set-password fails');
    const doubleSetup = await req('POST', '/api/auth/set-password', {
      email: 'newbie@test.com',
      token: 'any-token',
      password: 'another123',
    });
    ok('returns 400 for already-set password', doubleSetup.status === 400);

    // 15. GET /api/plans — public endpoint
    console.log('\n15. GET /api/plans');
    const plansResp = await req('GET', '/api/plans');
    ok('returns 200', plansResp.status === 200);
    ok('returns plans array', Array.isArray(plansResp.body.plans));
    ok('has 4 plans', plansResp.body.plans?.length === 4);
    const planIds = plansResp.body.plans?.map(p => p.id);
    ok('includes personal_free', planIds?.includes('personal_free'));
    ok('includes personal_pro', planIds?.includes('personal_pro'));
    ok('includes team', planIds?.includes('team'));
    ok('includes enterprise', planIds?.includes('enterprise'));

    // 15b. Each plan has required fields
    console.log('\n15b. Plan fields');
    const freePlan = plansResp.body.plans?.find(p => p.id === 'personal_free');
    ok('free plan has name', freePlan?.name === 'Free');
    ok('free plan has price', !!freePlan?.price);
    ok('free plan has features array', Array.isArray(freePlan?.features));
    ok('free plan has Learning mode feature', freePlan?.features?.includes('Learning mode'));

    const proPlan = plansResp.body.plans?.find(p => p.id === 'personal_pro');
    ok('pro plan has color', !!proPlan?.color);
    ok('pro plan has highlight flag', typeof proPlan?.highlight === 'boolean');
    ok('pro plan has description', !!proPlan?.description);

    // 15c. Enterprise has unlimited actions
    console.log('\n15c. Enterprise unlimited actions');
    const entPlan = plansResp.body.plans?.find(p => p.id === 'enterprise');
    ok('enterprise has Unlimited stored actions', entPlan?.features?.some(f => f.includes('Unlimited')));
    ok('enterprise has retention', entPlan?.features?.some(f => f.includes('retention')));

    // 15d. Lockdown does not block plans (GET)
    console.log('\n15d. Plans accessible during lockdown');
    await req('PUT', '/api/org', { lockdownActive: true }, token);
    const plansLocked = await req('GET', '/api/plans');
    ok('returns 200 during lockdown', plansLocked.status === 200);
    await req('PUT', '/api/org', { lockdownActive: false }, token);

    // 16. MFA login flow — re-enable MFA (was disabled in section 12)
    console.log('\n16. MFA login flow — re-enable MFA');
    const mfaLoginSetup = await req('POST', '/api/auth/mfa/setup', {}, token);
    ok('MFA setup returns 200', mfaLoginSetup.status === 200);
    const mfaLoginSecret = mfaLoginSetup.body.secret;
    ok('MFA setup returns secret', !!mfaLoginSecret);

    const loginTOTP = authenticator.generate(mfaLoginSecret);
    const mfaLoginVerify = await req('POST', '/api/auth/mfa/verify', { token: loginTOTP }, token);
    ok('MFA verify succeeds', mfaLoginVerify.status === 200);

    const meMFa = await req('GET', '/api/auth/me', null, token);
    ok('mfaEnabled is now true', meMFa.body.user?.mfaEnabled === true);

    // 16b. Login without MFA token — should return mfaRequired
    console.log('\n16b. Login without MFA token');
    const loginNoMfa = await req('POST', '/api/auth/login', { email: 'e2e@test.com', password: 'test123456' });
    ok('returns 200 (not 401)', loginNoMfa.status === 200);
    ok('mfaRequired is true', loginNoMfa.body.mfaRequired === true);
    ok('no JWT token returned', !loginNoMfa.body.token);

    // 16c. Login with invalid MFA token
    console.log('\n16c. Login with invalid MFA token');
    const loginBadMfa = await req('POST', '/api/auth/login', { email: 'e2e@test.com', password: 'test123456', mfaToken: '000000' });
    ok('returns 401 for bad MFA token', loginBadMfa.status === 401);

    // 16d. Login with valid MFA token
    console.log('\n16d. Login with valid MFA token');
    const validLoginTOTP = authenticator.generate(mfaLoginSecret);
    const loginGoodMfa = await req('POST', '/api/auth/login', { email: 'e2e@test.com', password: 'test123456', mfaToken: validLoginTOTP });
    ok('returns 200 with valid MFA token', loginGoodMfa.status === 200);
    ok('JWT token returned', !!loginGoodMfa.body.token);
    ok('user object returned', !!loginGoodMfa.body.user);
    ok('user email matches', loginGoodMfa.body.user?.email === 'e2e@test.com');

    // 17. company_admin cannot set lockdownActive (owner-only)
    console.log('\n17. Invite company_admin user');
    const inviteAdmin = await req('POST', '/api/auth/invite', { email: 'admin@test.com', role: 'company_admin' }, token);
    ok('returns 201', inviteAdmin.status === 201);
    ok('returns user object', !!inviteAdmin.body.user);
    const adminSetupToken = inviteAdmin.body.setupToken;
    ok('returns setupToken', !!adminSetupToken);

    // 17b. Set password for company_admin
    console.log('\n17b. Set company_admin password');
    const adminSetPw = await req('POST', '/api/auth/set-password', {
      email: 'admin@test.com',
      token: adminSetupToken,
      password: 'admin123456',
    });
    ok('returns 200', adminSetPw.status === 200);
    ok('returns JWT', !!adminSetPw.body.token);
    const adminToken = adminSetPw.body.token;

    // 17c. Login as company_admin
    console.log('\n17c. Login as company_admin');
    const adminLogin = await req('POST', '/api/auth/login', { email: 'admin@test.com', password: 'admin123456' });
    ok('returns 200', adminLogin.status === 200);
    ok('returns token', !!adminLogin.body.token);

    // 17d. Confirm role is company_admin
    console.log('\n17d. Confirm company_admin role');
    const adminMe = await req('GET', '/api/auth/me', null, adminToken);
    ok('returns 200', adminMe.status === 200);
    ok('role is company_admin', adminMe.body.user?.role === 'company_admin');

    // 17e. company_admin cannot set lockdownActive
    console.log('\n17e. company_admin blocked from lockdownActive');
    const adminLockdown = await req('PUT', '/api/org', { lockdownActive: true }, adminToken);
    ok('PUT /api/org lockdownActive returns 403', adminLockdown.status === 403);

    // 17f. company_admin cannot set tokenQuotaStatus
    console.log('\n17f. company_admin blocked from tokenQuotaStatus');
    const adminQuota = await req('PUT', '/api/org', { tokenQuotaStatus: 'exhausted' }, adminToken);
    ok('PUT /api/org tokenQuotaStatus returns 403', adminQuota.status === 403);

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
