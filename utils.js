const captchaApiKey = 'acd27ea20a61b65c7cfcf348a2cb9b5a';
const captchaSolverEndpoint = 'https://api.capmonster.cloud/createTask';
const captchaSolutionGetterEndpoint = 'https://api.capmonster.cloud/getTaskResult';

const getBase64FromUrl = async (url) => {
	const data = await fetch(url);
	const blob = await data.blob();
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.readAsDataURL(blob);
		reader.onloadend = () => {
			const base64data = reader.result;
			resolve(base64data);
		}
	});
}

const getCaptchaResultRetry = async (taskId, timeout=30000) => {
	let startTime = new Date(Date.now()).getTime();
	//console.log(startTime);

	let body = {
		clientKey: captchaApiKey,
		taskId: taskId,
	}

	const doThis = async () => {
		//console.log("doing this");
		let res = await new Promise((resolve, reject) => {
			let opts = {
				method: "POST",
				url: captchaSolutionGetterEndpoint,
				data: JSON.stringify(body),
				headers: {
					"Content-Type": "text/plain"
				},
				onload: function(response) {
					let responseObject = JSON.parse(response.response.replace('\\', ''));
					if (responseObject) {
						console.log('got a winner ', responseObject);

						resolve(responseObject);
					} else {
						console.log('error ', responseObject);
						reject(responseObject);
					}
				},
				onerror: function(error) {
					console.log('error', error);
					reject(error);
				},
			}
			GM.xmlHttpRequest(opts);
			console.log('opt', opts);
		});
		return res.solution;
	}
	let res = await doThis();
	return res;
}

const solveCaptcha = async(base64) => {
	let res = await new Promise((resolve, reject) => {
		let body = {
			clientKey: captchaApiKey,
			task: {
				type: "ImageToTextTask",
				body: base64,
			}
		}
		console.log(body);
		let opts = {
			method: "POST",
			url: captchaSolverEndpoint,
			data: JSON.stringify(body),
			headers: {
				"Content-Type": "text/plain"
			},
			onload: function(response) {
				let responseObject = JSON.parse(response.response.replace('\\', ''));
				if (responseObject) {
					resolve(responseObject);
				} else {
					reject(responseObject);
				}
			},
			onerror: function(error) {
				console.log('error', error);
				reject(error);
			},
		};
		console.log('opt', opts);
		GM.xmlHttpRequest(opts);
		//console.log('end');
	});
	res = await getCaptchaResultRetry(res.taskId, 30000);

	return res.text;
};

const clickButton = (button) => {
	button.trigger('click');
	button[0].click();
}

const goToUrl = (url) => {
	window.location.href = url
}

const goToUrlSuffix = async (suffix) => {
	goToUrl(siteUrl + suffix);
}

const urlContains = (suffix) => {
	let index = window.location.href.indexOf('.net') + 4;
	return window.location.href.includes(suffix, index);
}