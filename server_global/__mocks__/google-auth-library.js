class OAuth2Client{
  async verifyIdToken(){
    return {
      getPayload: () => ({ sub:'mockGoogleId', name:'MockUser', picture:'' })
    };
  }
}
module.exports = { OAuth2Client };