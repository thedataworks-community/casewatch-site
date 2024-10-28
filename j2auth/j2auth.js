// Jupiter 2 mobile authentication and other API support
// 
// THIS IS A SUBMODULE that will be shared by many apps for mobile authentication
// ...and this is an experiment to see if I can edit / update the repo from a project
//

const DEVICE_COOKIE = "jupiterDeviceID";

let bizID;

bizRegistrations = [];	// list of Business IDs this user is registered with

let appToken;			// application token for Jupiter graph

let userMobile;         // user's mobile number E164 unique ID
let serverCode;         // auth code returned by the server
let newDeviceToken;     // new token to store as cookie on device

let userToken;			// authenticated user token (device cookie)
let userProfile;

// server URLs might get overwritten with a local URL for testing
var authServerURL = "https://18-191-149-152.nip.io";
let apiServerURL

const apiUserProfile = '/userprofile/';
const apiAuthMobile = '/auth/';
const apiAuthRegister = '/register/';
const apiRegisterBiz = '/register-biz/';

function getCookie() {
	
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${DEVICE_COOKIE}=`);
	if (parts.length === 2) return parts.pop().split(';').shift();
}

userToken = getCookie();
var isAuthenticated = false; // track authentication status

function setCookie(cvalue, exdays) {
	
	console.log("set cookie");
	var d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	var expires = "expires="+ d.toUTCString();

	document.cookie = DEVICE_COOKIE + "=" + cvalue;
}

async function checkLocalConfig() {
	console.log("Check for local config info (server URL etc. - local.json");
	
	try {
		const response = await fetch('local.json');
		if (!response.ok) {
			console.error("Failed to fetch a local config file.");
			return false;
		}
		
		const config = await response.json();
		if (config['authserver']) {
			authServerURL = config['authserver'];
			console.log("local config - auth server:", authServerURL);
		}
		if (config['apiserver']) {
			apiServerURL = config['apiserver'];
			console.log("local config - API server:", apiServerURL);
		}
		return true;

	} catch (error) {
		console.error("Error loading local configs:", error);
		return false;
	}
}

// async function fetchUserProfile(apptoken, usertoken) {
async function fetchUserProfile() {

//	we already have usertoken initialized (maybe null)
	
	if (userToken) {
		console.log(`fetching profile: ${bizID}/${appToken} (user token ${userToken})`);
	} else {
		console.log(`fetching profile: ${bizID}/${appToken} (no user token found)`);
	}
	
//	this is a shameful hack... API is picky about parameter names
//	so we have to rename a couple of these guys here...
	usertoken = userToken;
	apptoken = appToken;
	biz_id = bizID;
	
	return fetch(authServerURL+apiUserProfile, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ apptoken, biz_id, usertoken })
	})
	.then(response => response.json())
	.then(data => {
		return data;
	})
	.catch(error => {
		console.error("Error fetching user profile:", error);
		return null;
	});
}

// Jupiter 2 Authentication Initialization
// can be used by any app or website requiring Jupiter 2 mobile auth
//
// app token identifies the "app" (or site, page, whatever) and
// bizid is the Business entity in the graph
//

async function j2AuthInit(bizid,apptok) {

	console.log(`Jupiter 2 authentication init... (app token ${apptok})`)

	bizID = bizid;		// global (initialize)
	appToken = apptok;	// global (initialize)
	
	if (!bizid || !apptok) {

		console.error(`need a biz id and an app token to init`);
		return		
	}	
	
	await checkLocalConfig();

	userProfile = await fetchUserProfile();
			
	console.log("user profile:",userProfile);
	
	if (userProfile.user) {                
		isAuthenticated = true;
	}
}

function requestAuthenticationCode(phoneNumber) {
	return fetch(authServerURL + apiAuthMobile, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ mobile: phoneNumber })
	})
	.then(response => response.json())
	.then(data => {
		console.log("AUTH", data);
		if (data?.authcode) {
			userMobile = data.mobile;
			serverCode = data.authcode;
			newDeviceToken = data.newtoken;
			return serverCode;
		} else {
			console.error("!! DIDN'T GET AN AUTH CODE !!");
			return null;
		}
	})
	.catch(error => {
		console.error('Error:', error);
		return null;
	});
}

async function verifyAuthenticationCode(userCode) {

	if (userCode.trim() == serverCode) {
		console.log(JSON.stringify({ token: newDeviceToken, mobile: userMobile }));

		try {
			const response = await fetch(authServerURL + apiAuthRegister, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					token: newDeviceToken,
					mobile: userMobile
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(`Error: ${response.status} - ${errorData.detail}`);
			}

			const responseData = await response.json();
			isAuthenticated = true;
			setCookie(newDeviceToken, 30); // 30 days (?)
			userToken = getCookie();

			userProfile = await fetchUserProfile(appToken, userToken);

			console.log("AUTH!", userProfile);
			return isAuthenticated;
		} catch (error) {
			console.error('AUTH VERIFY:', error);
			isAuthenticated = false;
			return isAuthenticated;
		}
	} else {
		isAuthenticated = false;
		return isAuthenticated;
	}
}

function getUserBusinessRegs(ph) {
	
	// hit the server to get a list of Business registrations for this phone number
	console.log(`TO DO: load Business registrations for ${ph}`);
}

function registerBusinessUser() {
	
	console.log(`registerBusinessUser in graph: ${userMobile}/${bizID}`)	
	
	if (userMobile && bizID) {
		
		console.log( JSON.stringify({ mob: userMobile, bizid: bizID }) );
		
		return fetch(authServerURL + apiRegisterBiz, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ mob: userMobile, bizid: bizID })
			})
			.then(response => response.json())
			.then(data => {
				return null;
			})
			.catch(error => {
				console.error('Error:', error);
				return null;
			});
	}
	else {
		
		console.log(`CANNOT registerBusinessUser ${userMobile}/${bizID}`);
	}
}

