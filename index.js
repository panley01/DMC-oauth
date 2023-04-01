export default {
	async fetch(request, env, ctx) {
		if (request.method != 'GET') return Response.redirect('https://discord.com')
		const reqUrl = new URL(request.url)
		if (!reqUrl.searchParams.get('code')) return Response.redirect(env.authUrl)
		const code = reqUrl.searchParams.get('code')
		let oauthParams = new URLSearchParams()
		oauthParams.append('client_id', env.CLIENT_ID)
		oauthParams.append('client_secret', env.CLIENT_SECRET)
		oauthParams.append('grant_type', 'authorization_code')
		oauthParams.append('code', code)
		oauthParams.append('redirect_uri', 'https://dmcoauth.panley01.workers.dev')
	
		const oauthReq = await fetch(
			'https://discord.com/api/v10/oauth2/token',
			{
				method: 'POST',
				body: oauthParams,
				headers: {
					'content-type': 'application/x-www-form-urlencoded'
				}
			}
		)
		if (!oauthReq.ok) {
			console.warn(`Bad Auth ${oauthReq.status} ${oauthReq.statusText}`)
			return Response.redirect(env.authUrl)
		}

		const OauthData = await oauthReq.json()
	
		const userReq = await fetch(
			'https://discord.com/api/v10/users/@me',
			{
				headers: {
					'content-type': 'application/json',
					authorization: `Bearer ${OauthData.access_token}`
				}
			}
		)
	
		if (!userReq.ok) {
			console.warn(`Identify not authed ${oauthReq.status} ${oauthReq.statusText}`)
			return Response.redirect(env.authUrl)
		}
	
		const userData = await userReq.json()
		console.log(JSON.stringify(userData))

		if ((BigInt(userData.flags) & BigInt(262144)) != BigInt(262144)) {
			if ((BigInt(userData.flags) & BigInt(1)) != BigInt(1)) {
				console.warn(`User not mod ${oauthReq.status} ${oauthReq.statusText}`)
				return new Response('This maze isn\'t meant for you.')
			}
		}
	
		await fetch(
			`https://discord.com/api/v10/guilds/${env.SERVER_ID}/members/${userData.id}`,
			{
				headers: {
					'content-type': 'application/json',
					authorization: `Bot ${env.BOT_TOKEN}`
				},
				method: 'PUT',
				body: JSON.stringify({
					access_token: OauthData.access_token
				})
			}
		)

		return Response.redirect(`https://discord.com/channels/${env.SERVER_ID}`)
		
	},
};
