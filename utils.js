(function() {
	var captchaSolverEndpoint = 'https://api.capmonster.cloud/createTask';
	var captchaSolutionGetterEndpoint = 'https://api.capmonster.cloud/getTaskResult';

	var getBase64FromUrl = async (url) => {
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

	var getCaptchaResultRetry = async (taskId, captchaApiKey, timeout=30000) => {
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

	var solveCaptcha = async(base64, captchaApiKey) => {
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

	var clickButton = (button) => {
		button.trigger('click');
		button[0].click();
	}

	var goToUrl = (url) => {
		window.location.href = url
	}

	var goToUrlSuffix = async (suffix) => {
		goToUrl(siteUrl + suffix);
	}

	var urlContains = (suffix) => {
		let index = window.location.href.indexOf('.net') + 4;
		return window.location.href.includes(suffix, index);
	}

	var sleep = (ms) => {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	var sleepRange = (min, max) => {
		return new Promise(resolve => setTimeout(resolve, Math.random() * (max-min) + min));
	}

	let allPokemonCaught = null;
	var fetchFromLocalStorage = () => {
		if (!localStorage.getItem('tppcPokemonCaught'))
			localStorage.setItem('tppcPokemonCaught', JSON.stringify({}));
		allPokemonCaught = JSON.parse(localStorage.getItem('tppcPokemonCaught'));
		console.log(allPokemonCaught);
	}
	var writeToLocalStorage = () => {
		console.log('writing', JSON.stringify(allPokemonCaught));
		localStorage.setItem('tppcPokemonCaught', JSON.stringify(allPokemonCaught));
	}
});