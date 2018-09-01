window.addEventListener("load", init);

let stage;

function init() {
	stage = new createjs.Stage("myCanvas");
	stage.enableMouseOver();
	let scene = 0;
	let player = [];

	// バックグラウンド
	let stageList = ["Arena", "Azure", "Helipad", "Italy", "Plane"];
	let area;
	let background;

	// キャラクター
	let character = ["Chloe", "Alisa", "Xiaoyu"];

	// カウント
	let count = 0;
	let countText = new createjs.Text("", "45px serif", "black");
	countText.x = 480;
	countText.y = 15;
	countText.textAlign = "center";
	let circle = new createjs.Shape();
	circle.graphics.beginStroke("black").setStrokeStyle(2);
	circle.graphics.beginFill("white").drawCircle(480, 43, 40);

	// メッセージ
	let frameText = new createjs.Text("", "100px serif", "black");
	frameText.textAlign = "center";
	frameText.x = 483;
	frameText.y = 118;
	let insideText = frameText.clone();
	insideText.color = "red";
	insideText.x = 480;
	insideText.y = 120;

	// 勝利数 + ラウンド
	let leftWin = 0;
	let rightWin = 0;
	let round = 3;

	// モード
	let modeList = ["VS", "EASY", "NORMAL", "HARD", "IMPOSSIBLE"];
	let modeButton = [];
	let mode = null;
	let norm = null;
	let modeText = new createjs.Text("", "30px serif", "black");
	modeText.textAlign = "center";
	modeText.x = 480;
	modeText.y = 500;
	modeText.alpha = 0.5;

	// サウンド
	createjs.Sound.registerSound("sound/setup.mp3", "setup");
	createjs.Sound.registerSound("sound/middle.mp3", "middle");
	createjs.Sound.registerSound("sound/low.mp3", "low");
	createjs.Sound.registerSound("sound/ko.mp3", "ko");
	createjs.Sound.registerSound("sound/jump.mp3", "jump");
	createjs.Sound.registerSound("sound/landing.mp3", "landing");
	createjs.Sound.registerSound("sound/end.mp3", "end");
	createjs.Sound.registerSound("sound/hit.mp3", "hit");
	createjs.Sound.volume = 0.2;

	initialize();
	drawMode();

	window.addEventListener("keydown", handleKeyDown);
	window.addEventListener("keyup", handleKeyUp);

	// キーダウン
	function handleKeyDown(event) {
		let keyCode = event.keyCode;
		player[0].handleKeyDown(keyCode, 65, 68, 87, 83, 71);
		player[1].handleKeyDown(keyCode, 37, 39, 38, 40, 110);
		if(keyCode === 32) {
			if(scene === 0 && mode !== null) start();
			else if(scene === 3) {
				scene = 0;
				mode = norm = null;
				initialize();
				for(let i = 0; i < modeButton.length; i++)
					stage.addChild(modeButton[i]);
			}
		}
	}

	// キーアップ
	function handleKeyUp(event) {
		let keyCode = event.keyCode;
		player[0].handleKeyUp(keyCode, 65, 68, 83);
		player[1].handleKeyUp(keyCode, 37, 39, 40);
	}

	createjs.Ticker.setFPS(60);
	createjs.Ticker.addEventListener("tick", handleTick);

	// アニメーション
	function handleTick() {
		// シーン分岐
		if(scene === 0 || scene === 3) { stage.update(); return; }
		if(scene === 2) { pause(); return; }

		// モード
		if(mode !== "VS") player[1].randomAction(player[0], norm);

		for(let i = 0; i < player.length; i++) {
			// パンチ
			if(player[i].isMiddle) player[i].middle(player[i^1]);
			// ローキック
			if(player[i].isLow) player[i].low(player[i^1]);
			// ジャンプ
			else if(player[i].isJump) player[i].jump();
			// しゃがみ
			else if(player[i].isSquat) player[i].squat();
			// 移動
			if(player[i].isLeft) player[i].left(player[i^1]);
			else if(player[i].isRight) player[i].right(player[i^1]);
			// チェック
			player[i].guardCheck();
			if(player[i].player.x < 40) player[i].player.x = 40;
			if(player[i].player.x > 920) player[i].player.x = 920;
			// レイジドライブ
			player[i].upperRageDrive(player[i^1]);
			player[i].lowerRageDrive(player[i^1]);
		}

		// カウント
		count++;
		countText.text = Math.ceil(60 - count/60);
		if(count >= 60) frameText.text = insideText.text = "";
		if(count >= 60*60) timeup(player[0], player[1]);

		deadCheck(player[0], player[1]);

		stage.update();
	}

	// 初期化
	function initialize() {
		player = [];
		let actor = [];

		// バックグラウンド + BGM
		area = stageList[Math.floor(Math.random() * stageList.length)];
		background = new createjs.Bitmap("area/" + area + ".jpg");
		createjs.Sound.registerSound("music/" + area + ".mp3", area);

		// プレイヤーの初期化
		actor[0] = character[Math.floor(Math.random() * character.length)];
		player[0] = new Player(1, 320, 350, actor[0]);
		player[0].line.graphics.drawRect(19, 19, 402, 42);
		player[0].gauge.graphics.drawRect(20, 20, 400, 40);

		// プレイヤーの初期化
		while(actor[0] === (actor[1] = character
					[Math.floor(Math.random() * character.length)]));
		player[1] = new Player(-1, 640, 350, actor[1]);
		player[1].line.graphics.drawRect(539, 19, 402, 42);
		player[1].gauge.graphics.drawRect(540, 20, 400, 40);

		// カウント
		count = 0;
		countText.text = 60;
		frameText.text = insideText.text = "READY";

		// ステージ
		stage.addChild(background);
		stage.addChild(modeText);
		stage.addChild(player[0].player);
		stage.addChild(player[1].player);
		stage.addChild(player[0].line);
		stage.addChild(player[1].line);
		stage.addChild(player[0].gauge);
		stage.addChild(player[1].gauge);
		stage.addChild(circle);
		stage.addChild(countText);
		stage.addChild(frameText);
		stage.addChild(insideText);

		drawWinMark();

		// リザルト
		if(leftWin === 3 && rightWin === 3)
			frameText.text = insideText.text = "DRAW";
		else if(leftWin === 3)
			frameText.text = insideText.text = "LEFT WINS";
		else if(rightWin === 3)
			frameText.text = insideText.text = "RIGHT WINS";
		if(leftWin === 3 || rightWin === 3) {
			leftWin = rightWin = 0;
			scene = 3;
		}
	}

	// スタート
	function start() {
		createjs.Sound.play(area);
		frameText.text = insideText.text = "FIGHT";
		scene = 1;
	}

	// ポーズ
	function pause() {
		count++;
		if(count >= 60*2) {
			createjs.Sound.stop(area);
			stage.removeAllChildren();
			scene = 0;
			initialize();
		}
	}

	// デッドチェック
	function deadCheck(red, blue) {
		if(red.HP <= 0 && blue.HP <= 0) {
			leftWin++; rightWin++;
			frameText.text = insideText.text = "DOUBLE K.O.";
		}
		else if(red.HP <= 0) {
			rightWin++;
			frameText.text = insideText.text = "K.O.";
		}
		else if(blue.HP <= 0) {
			leftWin++;
			frameText.text = insideText.text = "K.O.";
		}
		else return;
		createjs.Sound.play("ko");
		count = 0;
		scene = 2;
	}

	// タイムアップ
	function timeup(red, blue) {
		if(red.HP === blue.HP) {
			leftWin++; rightWin++;
			frameText.text = insideText.text = "TIME UP";
		}
		else if(red.HP > blue.HP) {
			leftWin++;
			frameText.text = insideText.text = "TIME UP";
		}
		else if(blue.HP > red.HP) {
			rightWin++;
			frameText.text = insideText.text = "TIME UP";
		}
		createjs.Sound.play("end");
		count = 0;
		scene = 2;
	}

	// 勝利数表示
	function drawWinMark() {
		let leftCircle = [];
		let rightCircle = [];
		for(let i = 0; i < round; i++) {
			let initial = new createjs.Shape();
			initial.graphics.beginStroke("black").setStrokeStyle(1);
			initial.graphics.beginFill("gray").drawCircle(0, 0, 10);
			let win = new createjs.Shape();
			win.graphics.beginStroke("black").setStrokeStyle(1);
			win.graphics.beginFill("#00bbff").drawCircle(0, 0, 10);
			if(i < leftWin) leftCircle[i] = win.clone();
			else leftCircle[i] = initial.clone();
			leftCircle[i].x = 410 - i * 30;
			leftCircle[i].y = 80;
			if(i < rightWin) rightCircle[i] = win.clone();
			else rightCircle[i] = initial.clone();
			rightCircle[i].x = 550 + i * 30;
			rightCircle[i].y = 80;
			stage.addChild(leftCircle[i]);
			stage.addChild(rightCircle[i]);
		}
	}

	// グリッド表示
	function drawGrid() {
		let line = new createjs.Shape();
		line.graphics.beginStroke("black").setStrokeStyle(2);
		line.graphics.moveTo(0, 0).lineTo(960, 0);
		line.y = 250;
		stage.addChild(line.clone());
		line.y = 500;
		stage.addChild(line.clone());
		line = new createjs.Shape();
		line.graphics.beginStroke("black").setStrokeStyle(2);
		line.graphics.moveTo(0, 0).lineTo(0, 540);
		line.x = 240;
		stage.addChild(line.clone());
		line.x = 400;
		stage.addChild(line.clone());
	}

	// モード表示
	function drawMode() {
		for(let i = 0; i < modeList.length; i++) {
			// ボタン
			let btn = new createjs.Container();
			btn.cursor = "pointer";
			// 通常時
			let btnUp = new createjs.Shape();
			btnUp.graphics.beginStroke("black").setStrokeStyle(5);
			btnUp.graphics.beginFill("LightGreen").drawCircle(0, 0, 100);
			btn.addChild(btnUp);
			btnUp.visible = true;
			// ロールオーバー時
			let btnOver = new createjs.Shape();
			btnOver.graphics.beginStroke("black").setStrokeStyle(5);
			btnOver.graphics.beginFill("pink").drawCircle(0, 0, 100);
			btn.addChild(btnOver);
			btnOver.visible = false;
			// テキスト
			let txt = new createjs.Text(modeList[i], "30px serif", "black");
			txt.textAlign = "center";
			txt.textBaseline = "middle";
			if(i === 0) txt.font = "35px serif";
			if(i === 4) txt.color = "#d00000";
			btn.addChild(txt);
			modeButton.push(btn);
		}
		modeButton[0].x = 480;
		modeButton[0].y = 200;
		modeButton[1].x = 140;
		modeButton[1].y = 200;
		modeButton[2].x = 310;
		modeButton[2].y = 420;
		modeButton[3].x = 650;
		modeButton[3].y = 420;
		modeButton[4].x = 820;
		modeButton[4].y = 200;
		for(let i = 0; i < modeList.length; i++) {
			stage.addChild(modeButton[i]);
			// クリックイベント
			modeButton[i].addEventListener("click", function() {
				changeMode(i);
			});
			// ロールオーバーイベント
			modeButton[i].addEventListener("mouseover", function() {
				modeButton[i].getChildAt(0).visible = false;
				modeButton[i].getChildAt(1).visible = true;
			});
			modeButton[i].addEventListener("mouseout", function() {
				modeButton[i].getChildAt(0).visible = true;
				modeButton[i].getChildAt(1).visible = false;
			});
		}
	}

	// モードチェンジ
	function changeMode(id) {
		mode = modeList[id];
		modeText.text = mode;
		for(let i = 0; i < modeList.length; i++)
			stage.removeChild(modeButton[i]);
		if(mode === modeList[0]) norm = null;
		else if(mode === modeList[1]) norm = 0;
		else if(mode === modeList[2]) norm = 0.25;
		else if(mode === modeList[3]) norm = 0.5;
		else if(mode === modeList[4]) norm = 1;
		scene = 0;
	}

	// 音量調節
	circle.addEventListener("click", function() {
		if(createjs.Sound.volume === 0.2)
			createjs.Sound.volume = 0.1;
		else if(createjs.Sound.volume === 0.1)
			createjs.Sound.volume = 0.2;
	});
}

class Player {
	// コンストラクタ
	constructor(id, x, y, design) {
		this.id = id;
		this.design = design;
		this.player = this.initialMode(x, y);
		this.attackMark = null;
		this.upperBullet = [];
		this.lowerBullet = [];
		this.isLeft = false;
		this.isRight = false;
		this.isJump = false;
		this.isSquat = false;
		this.isMiddle = false;
		this.isLow = false;
		this.isGuard = true;
		this.waitTime = 0;
		this.middleTime = 0;
		this.lowTime = 0;
		this.jumpTime = 0;
		this.HP = 400;
		this.rageDrive = "Unused";
		// ライン生成
		this.line = new createjs.Shape();
		this.line.graphics.beginStroke("black").setStrokeStyle(1);
		// ゲージ生成
		this.gauge = new createjs.Shape();
		this.gauge.graphics.beginFill("yellow");
	}

	// リセット
	reset(target) {
		if(!target.isSquat)
			target.player = target.initialMode
				(target.player.x, target.player.y);
		stage.removeChild(target.attackMark);
		target.waitTime = 0;
		target.middleTime = 0;
		target.lowTime = 0;
		target.isMiddle = false;
		target.isLow = false;
	}

	// ガードチェック
	guardCheck() {
		this.isGuard = false;
		if(!this.isJump && !this.isSquat && !this.isMiddle && !this.isLow) {
			if(this.id === 1 && !this.isRight) this.isGuard = true;
			else if(this.id === -1 && !this.isLeft) this.isGuard = true;
		}
	}

	// しゃがみ
	squat() {
		if(this.isJump || this.isMiddle) return;
		this.player = this.squatMode(this.player.x, this.player.y);
	}

	// 右移動
	right(target) {
		if(this.isMiddle || this.isLow || this.isSquat) return;
		if(this.id === 1 && this.player.x + 80 < target.player.x)
			this.player.x += 5;
		else if(this.id === -1)
			this.player.x += 3;
	}

	// 左移動
	left(target) {
		if(this.isMiddle || this.isLow || this.isSquat) return;
		if(this.id === 1)
			this.player.x -= 3;
		else if(this.id === -1 && this.player.x - 80 > target.player.x)
			this.player.x -= 5;
	}

	// ジャンプ
	jump() {
		if(this.jumpTime === 0) createjs.Sound.play("jump");
		if(this.jumpTime !== 0 && this.isSquat) this.isSquat = false;
		this.jumpTime++;
		if(this.jumpTime > 5) {
			this.player = this.initialMode(this.player.x, this.player.y);
			this.player.y += (this.jumpTime - 20) * 2;
		}
		else this.player = this.squatMode(this.player.x, this.player.y);
		if(this.jumpTime > 33) {
			this.jumpTime = 0;
			this.isJump = false;
			createjs.Sound.play("landing");
		}
	}

	// ゲージ更新
	updateGauge(target) {
		if(target.HP < 0) target.HP = 0;
		stage.removeChild(target.gauge);
		target.gauge = new createjs.Shape();
		if(target.HP <= 75)
			target.gauge.graphics.beginFill("red");
		else
			target.gauge.graphics.beginFill("yellow");
		if(this.id === 1)
			target.gauge.graphics.drawRect(540, 20, target.HP, 40);
		else if(this.id === -1)
			target.gauge.graphics.drawRect(20, 20, target.HP, 40);
		stage.addChild(target.gauge);
	}

	// 中段攻撃
	middle(target) {
		// 入力時
		if(this.waitTime === 0 && this.middleTime === 0) {
			if(this.isSquat || this.isLow) {
				this.isLow = true;
				return;
			}
			this.player = this.waitMiddleMode(this.player.x, this.player.y);
			this.waitTime++;
			createjs.Sound.play("setup");
		}
		// 硬直時
		else if(this.waitTime !== 0) {
			if(this.HP <= 75 && this.rageDrive === "Unused") {
				if(this.isJump && this.jumpTime === 0)
					this.rageDrive = "Upper";
				else if(this.isSquat && !this.isJump)
					this.rageDrive = "Lower";
			}
			this.waitTime++;
			if(this.waitTime >= 15) {
				if(this.rageDrive === "Lower")
					this.player = this.squatMode
						(this.player.x, this.player.y);
				else if(this.rageDrive !== "Upper") {
					this.player = this.initialMode
						(this.player.x, this.player.y);
					this.attackMark = this.makeMiddle
						(this.player.x, this.player.y);
				}
				this.waitTime = 0;
				this.middleTime++;
				createjs.Sound.play("middle");
			}
		}
		// 攻撃時
		else if(this.middleTime !== 0) {
			if(this.rageDrive === "Upper") this.upperRageDrive();
			else if(this.rageDrive === "Lower") this.lowerRageDrive();
			else if(this.middleTime === 1) {
				for(let i = 25; i < 205; i += 10) {
					let point = target.player.globalToLocal
					(this.attackMark.x + this.id * i, this.attackMark.y);
					// ヒットテスト
					if(target.player.hitTest(point.x, point.y)) {
						target.player.x += this.id * 50;
						if(!target.isGuard) {
							target.HP -= 50 + (15 * (this.HP <= 75));
							this.updateGauge(target);
							this.reset(target);
							target.isMiddle = true;
							target.middleTime = 10;
							this.middleTime = 10;
						}
						else this.reset(target);
						break;
					}
				}
			}
			this.middleTime++;
			if(this.middleTime >= 30) {
				if(this.rageDrive==="Upper" || this.rageDrive==="Lower")
					this.rageDrive = "Used";
				this.reset(this);
			}
		}
		if(this.jumpTime === 0) this.isJump = false;
	}

	// 下段攻撃
	low(target) {
		if(this.jumpTime > this.lowTime ||
				this.waitTime !== 0 || this.middleTime !== 0) {
			this.isLow = false;
			return;
		}
		// 入力時
		if(this.lowTime === 0) {
			this.player = this.squatMode(this.player.x, this.player.y);
			this.attackMark = this.makeLow(this.player.x, this.player.y);
			this.lowTime++;
			createjs.Sound.play("low");
		}
		// 攻撃時
		else if(this.lowTime !== 0) {
			if(this.lowTime === 1) {
				for(let i = 25; i <= 195; i += 10) {
					let point = target.player.globalToLocal
					(this.attackMark.x + this.id * i, this.attackMark.y);
					// ヒットテスト
					if(target.player.hitTest(point.x, point.y)) {
						target.player.x += this.id * 50;
						if(!target.isSquat || target.isLow) {
							target.HP -= 25 + (10 * (this.HP <= 75));
							this.updateGauge(target);
							this.reset(target);
							target.isLow = true;
							target.lowTime = 20;
							this.lowTime = 20;
						}
						else this.reset(target);
						break;
					}
				}
			}
			this.lowTime++;
			if(this.lowTime >= 50) this.reset(this);
		}
	}

	// 上段レイジドライブ
	upperRageDrive(target = null) {
		if(target === null) {
			let bullet = this.makeBullet(this.player.x, this.player.y, -80);
			this.upperBullet.push(bullet);
			stage.addChild(bullet);
		}
		else {
			for(let i = 0; i < this.upperBullet.length; i++) {
				this.upperBullet[i].x += this.id * 10;
				let point = target.player.globalToLocal
					(this.upperBullet[i].x, this.upperBullet[i].y);
				if(target.player.hitTest(point.x, point.y)) {
					target.player.x += this.id * 5;
					if(!target.isGuard) {
						target.HP -= 10;
						this.updateGauge(target);
					}
					stage.removeChild(this.upperBullet[i]);
					this.upperBullet.splice(i, 1);
					createjs.Sound.play("hit");
				}
			}
		}
	}

	// 下段レイジドライブ
	lowerRageDrive(target = null) {
		if(target === null) {
			let bullet = this.makeBullet
				(this.player.x, this.player.y, 20);
			this.lowerBullet.push(bullet);
			stage.addChild(bullet);
		}
		else {
			for(let i = 0; i < this.lowerBullet.length; i++) {
				this.lowerBullet[i].x += this.id * 10;
				let point = target.player.globalToLocal
					(this.lowerBullet[i].x, this.lowerBullet[i].y);
				if(target.player.hitTest(point.x, point.y)) {
					target.player.x += this.id * 5;
					if(!target.isSquat || target.isLow) {
						target.HP -= 10;
						this.updateGauge(target);
					}
					stage.removeChild(this.lowerBullet[i]);
					this.lowerBullet.splice(i, 1);
					createjs.Sound.play("hit");
				}
			}
		}
	}

	// 弾生成
	makeBullet(x, y, norm) {
		let bullet = new createjs.Shape();
		bullet.graphics.beginFill
			(createjs.Graphics.getHSL(360*Math.random(), 100, 50));
		bullet.graphics.beginStroke("black").setStrokeStyle(0.5);
		bullet.graphics.drawPolyStar(0, 0, 15, 8, 0.6, -90);
		bullet.x = x;
		bullet.y = y + norm + Math.random() * 120;
		return bullet;
	}

	// キーダウン
	handleKeyDown(keyCode, left, right, jump, down, middle) {
		if(keyCode === left) this.isLeft = true;
		else if(keyCode === right) this.isRight = true;
		else if(keyCode === jump && !this.isSquat) this.isJump = true;
		else if(keyCode === down) this.isSquat = true;
		else if(keyCode === middle) this.isMiddle = true;
	}

	// キーアップ
	handleKeyUp(keyCode, left, right, down) {
		if(keyCode === left) this.isLeft = false;
		else if(keyCode === right) this.isRight = false;
		else if(keyCode === down) {
			this.isSquat = false;
			if(this.lowTime === 0) {
				this.player = this.initialMode
					(this.player.x, this.player.y);
			}
		}
	}

	// 初期モード
	initialMode(x, y) {
		let player;
		if(this.design === "Chloe") {
			player = new createjs.Bitmap("character/Chloe.png");
			player.regX = 100;
			player.regY = 105;
		}
		if(this.design === "Alisa") {
			player = new createjs.Bitmap("character/Alisa.png");
			player.scale = 0.95;
			player.regX = 85;
			player.regY = 132;
		}
		if(this.design === "Xiaoyu") {
			player = new createjs.Bitmap("character/Xiaoyu.png");
			player.scale = 0.25;
			player.regX = 400;
			player.regY = 420;
		}
		player.x = x;
		player.y = y;
		stage.removeChild(this.player);
		stage.addChild(player);
		return player;
	}

	// 中段攻撃準備モード
	waitMiddleMode(x, y) {
		let player = new createjs.Container();
		player.x = x;
		player.y = y;
		let aura = new createjs.Bitmap("image/aura.png");
		aura.scale = 0.4;
		aura.x = -120;
		aura.y = -130;
		player.addChild(aura);
		player.addChild(this.initialMode(0, 0));
		stage.removeChild(this.player);
		stage.addChild(player);
		return player;
	}

	// しゃがみモード
	squatMode(x, y) {
		let player;
		if(this.design === "Chloe") {
			player = new createjs.Bitmap("character/Chloe2.png");
			player.scale = 0.4;
			player.regX = 320;
			player.regY = 150;
		}
		if(this.design === "Alisa") {
			player = new createjs.Bitmap("character/Alisa2.png");
			player.scale = 0.42;
			player.regX = 280;
			player.regY = 100;
		}
		if(this.design === "Xiaoyu") {
			player = new createjs.Bitmap("character/Xiaoyu2.png");
			player.scale = 0.65;
			player.regX = 100;
			player.regY = 25;
		}
		player.x = x;
		player.y = y;
		stage.removeChild(this.player);
		stage.addChild(player);
		return player;
	}

	// 中段攻撃生成
	makeMiddle(x, y) {
		let attackMark = new createjs.Bitmap("image/middle.png");
		attackMark.scaleX = 0.5;
		attackMark.scaleY = 0.7;
		attackMark.regX = -10;
		attackMark.regY = 195;
		attackMark.rotation = 180 * (this.id === -1);
		attackMark.x = x;
		attackMark.y = y;
		stage.addChild(attackMark);
		return attackMark;
	}

	// 下段攻撃生成
	makeLow(x, y) {
		let attackMark = new createjs.Bitmap("image/low.png");
		attackMark.scaleX = 0.5;
		attackMark.regX = 400;
		attackMark.regY = 133;
		attackMark.rotation = 180 * (this.id === 1);
		attackMark.x = x;
		attackMark.y = y + 100;
		stage.addChild(attackMark);
		return attackMark;
	}

	// スター生成
	makeStar(x, y) {
		let star = new createjs.Shape();
		star.graphics.beginFill("yellow");
		star.graphics.beginStroke("black").setStrokeStyle(2);
		star.graphics.drawPolyStar(0, 0, 50, 5, 0.6, -90);
		star.regX = this.id * -150;
		star.regY = -15;
		star.x = x;
		star.y = y;
		stage.addChild(star);
		return star;
	}

	// ランダムアクション
	randomAction(target, norm) {
		let left = 37;
		let right = 39;
		let jump = 38;
		let down = 40;
		let middle = 110;

		// キーダウン
		if(target.isLow && target.lowTime <= 10 && Math.random() < norm)
			this.handleKeyDown(down, left, right, jump, down, middle);
		if(this.player.x - target.player.x > 300)
			this.handleKeyDown(left, left, right, jump, down, middle);
		if(Math.random() < 0.1)
			this.handleKeyDown(down, left, right, jump, down, middle);
		if(Math.random() < 0.3)
			this.handleKeyDown(left, left, right, jump, down, middle);
		if(Math.random() < 0.5)
			this.handleKeyDown(right, left, right, jump, down, middle);
		if(Math.random() < 0.1 && this.lowTime < 20 &&
		!(target.isMiddle && !target.isLow && target.middleTime <= 1))
			this.handleKeyDown(jump, left, right, jump, down, middle);
		if(Math.random() < 0.2 && this.player.x - target.player.x < 200 &&
			!(target.isMiddle && !target.isLow && target.middleTime <= 1))
			this.handleKeyDown(middle, left, right, jump, down, middle);

		// キーアップ
		if(target.isMiddle && !target.isLow && target.middleTime <= 1 &&
		this.player.x - target.player.x < 300 && Math.random() < norm) {
			this.handleKeyUp(left, left, right, down);
			this.handleKeyUp(down, left, right, down);
		}
		if(Math.random() < 0.1)
			this.handleKeyUp(left, left, right, down);
		if(Math.random() < 0.1)
			this.handleKeyUp(right, left, right, down);
		if(Math.random() < 0.1)
			this.handleKeyUp(down, left, right, down);
	}
}
