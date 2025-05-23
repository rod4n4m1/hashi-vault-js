//Simple smoke test
// AppRole auth method
// This test will login to the AppRole auth method using a role-id and secret-id.
// This test will create a new AppRole role, create a new AppRole secret-id, read the secret-id, and then destroy the secret-id.
// source process.env
// node AppRole-smoke-test.js
// # Check role-id
// vault read auth/approle/role/knight/role-id
// # Create new secret-id
// vault write -f auth/approle/role/knight/secret-id
import Vault from '../src/Vault.js';

const RoleId = process.env.ROLE_ID;
const SecretId = process.env.SECRET_ID;
const ClientCert = process.env.CLIENT_CERT;
const ClientKey = process.env.CLIENT_KEY;
const CACert = process.env.CA_CERT;
const VaultUrl = process.env.VAULT_URL;
const AppRole = process.env.APPROLE;
const Metadata = {
  tag1: "knight-vault",
  tag2: "smoke-test"
};

const vault = new Vault( {
    https: true,
    cert: ClientCert,
    key: ClientKey,
    cacert: CACert,
    baseUrl: VaultUrl,
    timeout: 1000,
    proxy: false
});

let token = null;

vault.healthCheck().then(function(data) {
  console.log('> healthCheck output: \n',data);
  if (!data.sealed) {
    vault.loginWithAppRole(RoleId, SecretId, 'auth/approle').then(function(data){
      token = data.client_token;
      console.log('>> loginWithAppRole output: \n',data);
      vault.readAppRoleSecretId(data.client_token, AppRole, SecretId).then(function(data){
        console.log('>>> readAppRoleSecretId output: \n',data);
      }).catch(function(readError){
        console.error('>>> readAppRoleSecretId error: \n',readError);
      });
      vault.generateAppRoleSecretId(token, AppRole, JSON.stringify(Metadata)).then(function(data){
        console.log('>>> generateNewAppRoleSecretId output: \n',data);
        let newSecretId = data.secret_id;
        vault.destroyAppRoleSecretId(token, AppRole, newSecretId).then(function(data) {
          console.log('>>>> destroyAppRoleSecretId output: \n',data);
        }).catch(function(destroyError) {
          console.error('>>>> destroyAppRoleSecretId error: \n',destroyError);
        });
      }).catch(function(generateError) {
        console.error('>>> generateNewAppRoleSecretId error: \n',generateError);
      });
    }).catch(function(loginError){
        console.error('>> loginWithAppRole error: \n',loginError);
        console.error('>> loginWithAppRole error: \n',loginError.response.data);
    });
  }
}).catch(function(healthError){
  console.error('> healthCheck error: \n',healthError);
});
