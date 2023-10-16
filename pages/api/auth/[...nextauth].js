import spotifyApi, { LOGIN_URL } from "@/lib/spotify"
import NextAuth from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"

async function refreshAccessToken(token){
    try {
        spotifyApi.setAccessToken(token.accessToken);
        spotifyApi.setRefreshToken(token.refreshToken);
        const {body:refreshedToken} = await spotifyApi.refreshAccessToken();
        console.log('refreshed toke is',refreshedToken);
        return  {
            ...token,
            accessToken: refreshedToken.access_token,
            accessTokenExpires: Date.now() +refreshAccessToken.expires_in * 1000, // = 1 hour as 3600 returns from spotify Api
            refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
        }
    }catch (error){
        console.error(error)
        return  {
            ...token,
            error:"RefreshAccessTokenError",
        };
    }
}

export default NextAuth ({
  // Configure one or more authentication providers
  providers: [
    SpotifyProvider({
      clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_CLIENT_SECRET,
      authorization: LOGIN_URL,
    }),
    // ...add more providers here
  ],
  secret: process.env.JWT_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({token,account,user}){
    // First Scenario: initial sign in
        if(account && user){
        return {
            ...token,
            accessToken:account.access_token,
            refreshToken: account.refreshToken,
            username:account.providerAccountId,
            accessTokenExpires: account.expires_at*1000,//we are handling expire times milliseconds hence * 1000
        };
    }
    // Second Scenario: Return previous token if the access token has not expired yet
    if (Date.now() < token.accessTokenExpires){
        return token;
    }
    // Third Scenario: Acces token has expired , so we need to refresh it...
    console.log('Acces token has expired refresshing...');
    return await refreshAccessToken(token);
  },
  async session ({session,token}){
    session.user.accessToken = token.accessToken;
    session.user.refreshToken = token.refreshToken;
    session.user.username = token.username;

    return session;
  },
},
});

