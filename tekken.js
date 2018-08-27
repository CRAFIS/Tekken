window.addEventListener("load", init);

let stage;

function init() {
	stage = new createjs.Stage("myCanvas");
	let player = [];

	// バックグラウンド
	let background = new createjs.Bitmap('Background.jpg');
	stage.addChild(background);

	// Player0の初期化
	player[0] = new Player(1, 320, 350, "DarkRed");
	player[0].line.graphics.drawRect(19, 19, 402, 42);
	player[0].gauge.graphics.drawRect(20, 20, 400, 40);
	stage.addChild(player[0].player);
	stage.addChild(player[0].line);
	stage.addChild(player[0].gauge);

	// Player1の初期化
	player[1] = new Player(-1, 640, 350, "DarkBlue");
	player[1].line.graphics.drawRect(539, 19, 402, 42);
	player[1].gauge.graphics.drawRect(540, 20, 400, 40);
	stage.addChild(player[1].player);
	stage.addChild(player[1].line);
	stage.addChild(player[1].gauge);

	// サークル
	let circle = new createjs.Shape();
	circle.graphics.beginStroke("black").setStrokeStyle(2);
	circle.graphics.beginFill("white").drawCircle(480, 43, 40);
	stage.addChild(circle);

	// カウント
	let count = 0;
	let countText = new createjs.Text(60, "45px serif", "black");
	countText.x = 480;
	countText.y = 15;
	countText.textAlign = "center";
	stage.addChild(countText);

	// メッセージ
	let message = new createjs.Text("", "100px serif", "black");
	message.x = 480;
	message.y = 120;
	message.textAlign = "center";
	stage.addChild(message);

	// サウンド
	createjs.Sound.registerSound("sound/setup.mp3", "setup");
	createjs.Sound.registerSound("sound/punch.mp3", "punch");
	createjs.Sound.registerSound("sound/kick.mp3", "kick");
	createjs.Sound.registerSound("sound/ko.mp3", "ko");
	createjs.Sound.registerSound("sound/jump.mp3", "jump");
	createjs.Sound.registerSound("sound/landing.mp3", "landing");
	createjs.Sound.registerSound("sound/end.mp3", "end");
	createjs.Sound.registerSound("sound/hit.mp3", "hit");
	createjs.Sound.registerSound("sound/BGM.mp3", "BGM");

	let onBGM = false;

	window.addEventListener("keydown", handleKeydown);
	window.addEventListener("keyup", handleKeyUp);

	// キーダウン
	function handleKeydown(event) {
		let keyCode = event.keyCode;
		player[0].handleKeydown(keyCode, 65, 68, 87, 83, 71);
		player[1].handleKeydown(keyCode, 37, 39, 38, 40, 110);
		if(keyCode === 32 && !onBGM) {
			createjs.Sound.play("BGM");
			onBGM = true;
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
		for(let i = 0; i < player.length; i++) {
			// パンチ
			if(player[i].isPunch) player[i].punch(player[i^1]);
			// ローキック
			if(player[i].isLowKick) player[i].lowKick(player[i^1]);
			// ジャンプ
			else if(player[i].isJump) player[i].jump();
			// しゃがみ
			else if(player[i].isDown) player[i].squat();
			// 移動
			if(player[i].isLeft) player[i].left(player[i^1]);
			else if(player[i].isRight) player[i].right(player[i^1]);
			// チェック
			player[i].guardCheck();
			if(player[i].player.x < 40) player[i].player.x = 40;
			if(player[i].player.x > 920) player[i].player.x = 920;
			if(player[i].HP <= 0) player[i].dead(message);
			// レイジドライブ
			player[i].upperRageDrive(player[i^1]);
			player[i].lowerRageDrive(player[i^1]);
		}

		// カウント
		count++;
		countText.text = Math.ceil(60 - count/60);
		if(count/60 >= 61) {
			if(player[0].HP === player[1].HP) message.text = "DRAW";
			else if(player[0].HP > player[1].HP) message.text = "RED WINS!!";
			else if(player[1].HP > player[0].HP) message.text = "BLUE WINS!!";
			countText.text = 0;
			createjs.Sound.play("end");
			createjs.Ticker.removeAllEventListeners();
			stage.removeAllEventListeners();
		}

		stage.update();
	}
}

class Player {
	// コンストラクタ
	constructor(id, x, y, color) {
		this.id = id;
		this.color = color;
		this.player = this.initialMode(x, y);
		this.star = null;
		this.upperBullet = [];
		this.lowerBullet = [];
		this.isLeft = false;
		this.isRight = false;
		this.isJump = false;
		this.isDown = false;
		this.isPunch = false;
		this.isLowKick = false;
		this.isGuard = true;
		this.waitTime = 0;
		this.punchTime = 0;
		this.lowKickTime = 0;
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
		if(!target.isDown) {
			stage.removeChild(target.player);
			target.player = target.initialMode(target.player.x, target.player.y);
			stage.addChild(target.player);
		}
		target.punchTime = 0;
		target.lowKickTime = 0;
		target.waitTime = 0;
		target.isLowKick = false;
		target.isPunch = false;
	}

	// 死亡
	dead(message) {
		if(this.id === 1) message.text = "BLUE WINS!!";
		else if(this.id === -1) message.text = "RED WINS!!";
		createjs.Sound.play("ko");
		createjs.Ticker.removeAllEventListeners();
		stage.removeAllEventListeners();
	}

	// ガードチェック
	guardCheck() {
		this.isGuard = false;
		if(!this.isJump && !this.isDown && !this.isPunch && !this.isLowKick) {
			if(this.id === 1 && !this.isRight) this.isGuard = true;
			else if(this.id === -1 && !this.isLeft) this.isGuard = true;
		}
	}

	// しゃがみ
	squat() {
		if(this.isJump || this.isPunch) return;
		stage.removeChild(this.player);
		this.player = this.squatMode(this.player.x, this.player.y);
		stage.addChild(this.player);
	}

	// 右移動
	right(target) {
		if(this.isPunch || this.isLowKick || this.isDown) return;
		if(this.id === 1 && this.player.x + 80 < target.player.x)
			this.player.x += 5;
		else if(this.id === -1)
			this.player.x += 3;
	}

	// 左移動
	left(target) {
		if(this.isPunch || this.isLowKick || this.isDown) return;
		if(this.id === 1)
			this.player.x -= 3;
		else if(this.id === -1 && this.player.x - 80 > target.player.x)
			this.player.x -= 5;
	}

	// ジャンプ
	jump() {
		if(this.jumpTime === 0) createjs.Sound.play("jump");
		this.jumpTime++;
		this.player.y += (this.jumpTime - 15) * 2;
		if(this.jumpTime > 28) {
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

	// ローキック
	lowKick(target) {
		if(this.jumpTime > this.lowKickTime ||
				this.waitTime !== 0 || this.punchTime !== 0) {
			this.isLowKick = false;
			return;
		}
		// 入力時
		if(this.lowKickTime === 0) {
			stage.removeChild(this.player);
			this.player = this.lowKickMode(this.player.x, this.player.y);
			stage.addChild(this.player);
			this.lowKickTime++;
			createjs.Sound.play("kick");
		}
		// 攻撃時
		else if(this.lowKickTime !== 0) {
			if(this.lowKickTime === 1) {
				for(let i = 0; i <= 120; i += 10) {
					let point = target.player.globalToLocal
						(this.player.x + this.id * i, this.player.y + 120);
					if(target.player.hitTest(point.x, point.y)) {
						target.player.x += this.id * 50;
						if(!target.isDown || target.isLowKick) {
							target.HP -= 25 + (10 * (this.HP <= 75));
							this.updateGauge(target);
							this.reset(target);
							target.isLowKick = true;
							target.lowKickTime = 20;
							this.lowKickTime = 20;
						}
						else this.reset(target);
						break;
					}
				}
			}
			this.lowKickTime++;
			if(this.lowKickTime >= 50) this.reset(this);
		}
	}

	// パンチ
	punch(target) {
		// 入力時
		if(this.waitTime === 0 && this.punchTime === 0) {
			if(this.isDown || this.isLowKick) {
				this.isLowKick = true;
				return;
			}
			stage.removeChild(this.player);
			this.player = this.waitPunchMode(this.player.x, this.player.y);
			stage.addChild(this.player);
			this.waitTime++;
			createjs.Sound.play("setup");
		}
		// 硬直時
		else if(this.waitTime !== 0) {
			if(this.HP <= 75 && this.rageDrive === "Unused") {
				if(this.isJump && this.jumpTime === 0) this.rageDrive = "Upper";
				else if(this.isDown) this.rageDrive = "Lower";
			}
			this.waitTime++;
			if(this.waitTime >= 20) {
				stage.removeChild(this.player);
				if(this.rageDrive === "Upper")
					this.player = this.punchMode(this.player.x, this.player.y);
				else if(this.rageDrive === "Lower")
					this.player = this.squatMode(this.player.x, this.player.y);
				else {
					this.player = this.punchMode(this.player.x, this.player.y);
					this.star = this.makeStar(this.player.x, this.player.y);
					this.star.x = this.player.x;
					this.star.y = this.player.y;
					stage.addChild(this.star);
				}
				stage.addChild(this.player);
				this.waitTime = 0;
				this.punchTime++;
				createjs.Sound.play("punch");
			}
		}
		// 攻撃時
		else if(this.punchTime !== 0) {
			if(this.rageDrive === "Upper") this.upperRageDrive();
			else if(this.rageDrive === "Lower") this.lowerRageDrive();
			else if(this.punchTime === 1) {
				let point1 = target.player.globalToLocal
					(this.player.x + this.id * 90, this.player.y - 10);
				let point2 = target.player.globalToLocal
					(this.player.x + this.id * 137, this.player.y + 24);
				let point3 = target.player.globalToLocal
					(this.player.x + this.id * 120, this.player.y + 80);
				let point4 = target.player.globalToLocal
					(this.player.x + this.id * 90, this.player.y + 40);
				if(target.player.hitTest(point1.x, point1.y) ||
						target.player.hitTest(point2.x, point2.y) ||
						target.player.hitTest(point3.x, point3.y) ||
						target.player.hitTest(point4.x, point4.y)) {
					target.player.x += this.id * 50;
					if(!target.isGuard) {
						target.HP -= 50 + (15 * (this.HP <= 75));
						this.updateGauge(target);
						this.reset(target);
						target.isPunch = true;
						target.punchTime = 2;
					}
					else this.reset(target);
				}
			}
			this.punchTime++;
			if(this.punchTime >= 20) {
				if(this.rageDrive === "Upper" || this.rageDrive === "Lower")
					this.rageDrive = "Used";
				else stage.removeChild(this.star);
				this.reset(this);
			}
		}
		if(this.jumpTime < this.waitTime || this.jumpTime < this.punchTime)
			this.isJump = false;
	}

	// 上段レイジドライブ
	upperRageDrive(target = null) {
		if(target === null) {
			let bullet = new createjs.Shape();
			bullet.graphics.beginFill("black").drawCircle(0, 0, 8);
			bullet.x = this.player.x;
			bullet.y = this.player.y - 40 + Math.random() * 100;
			this.upperBullet.push(bullet);
			stage.addChild(bullet);
		}
		else {
			for(let i = 0; i < this.upperBullet.length; i++) {
				this.upperBullet[i].x += this.id * 10;
				let point = target.player.globalToLocal
					(this.upperBullet[i].x, this.upperBullet[i].y);
				if(target.player.hitTest(point.x, point.y)) {
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
			let bullet = new createjs.Shape();
			bullet.graphics.beginFill("black").drawCircle(0, 0, 8);
			bullet.x = this.player.x;
			bullet.y = this.player.y + 50 + Math.random() * 100;
			this.lowerBullet.push(bullet);
			stage.addChild(bullet);
		}
		else {
			for(let i = 0; i < this.lowerBullet.length; i++) {
				this.lowerBullet[i].x += this.id * 10;
				let point = target.player.globalToLocal
					(this.lowerBullet[i].x, this.lowerBullet[i].y);
				if(target.player.hitTest(point.x, point.y)) {
					if(!target.isDown || target.isLowKick) {
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

	// キーダウン
	handleKeydown(keyCode, left, right, jump, down, punch) {
		if(keyCode === left) this.isLeft = true;
		else if(keyCode === right) this.isRight = true;
		else if(keyCode === jump && !this.isDown) this.isJump = true;
		else if(keyCode === down) this.isDown = true;
		else if(keyCode === punch) this.isPunch = true;
	}

	// キーアップ
	handleKeyUp(keyCode, left, right, down) {
		if(keyCode === left) this.isLeft = false;
		else if(keyCode === right) this.isRight = false;
		else if(keyCode === down) {
			this.isDown = false;
			if(this.lowKickTime === 0) {
				stage.removeChild(this.player);
				this.player = this.initialMode(this.player.x, this.player.y);
				stage.addChild(this.player);
			}
		}
	}

	// 初期モード
	initialMode(x, y) {
		let player = new createjs.Container();
		player.x = x;
		player.y = y;
		let face = new createjs.Shape();
		face.graphics.beginFill(this.color).drawCircle(0, 0, 40);
		let line = new createjs.Shape();
		line.graphics.beginFill(this.color);
		line.graphics.beginStroke(this.color).setStrokeStyle(15);
		line.graphics.moveTo(0, 0).lineTo(0, 100);
		line.graphics.moveTo(0, 100).lineTo(-20, 150);
		line.graphics.moveTo(0, 100).lineTo(20, 150);
		line.graphics.setStrokeStyle(10).moveTo(0, 50).lineTo(-30, 80);
		line.graphics.setStrokeStyle(10).moveTo(0, 50).lineTo(30, 80);
		player.addChild(face);
		player.addChild(line);
		return player;
	}

	// パンチ準備モード
	waitPunchMode(x, y) {
		let player = new createjs.Container();
		player.x = x;
		player.y = y;
		let face = new createjs.Shape();
		face.graphics.beginFill(this.color).drawCircle(0, 0, 40);
		let line = new createjs.Shape();
		line.graphics.beginFill(this.color);
		line.graphics.beginStroke(this.color).setStrokeStyle(15);
		line.graphics.moveTo(0, 0).lineTo(0, 100);
		line.graphics.moveTo(0, 100).lineTo(-20, 150);
		line.graphics.moveTo(0, 100).lineTo(20, 150);
		line.graphics.setStrokeStyle(10).moveTo(0, 50).lineTo(-50, 40);
		line.graphics.setStrokeStyle(10).moveTo(0, 50).lineTo(50, 40);
		player.addChild(face);
		player.addChild(line);
		return player;
	}

	// パンチモード
	punchMode(x, y) {
		let player = new createjs.Container();
		player.x = x;
		player.y = y;
		let face = new createjs.Shape();
		face.graphics.beginFill(this.color).drawCircle(0, 0, 40);
		let line = new createjs.Shape();
		line.graphics.beginFill(this.color);
		line.graphics.beginStroke(this.color).setStrokeStyle(15);
		line.graphics.moveTo(0, 0).lineTo(0, 100);
		line.graphics.moveTo(0, 100).lineTo(-20, 150);
		line.graphics.moveTo(0, 100).lineTo(20, 150);
		line.graphics.setStrokeStyle(10).moveTo(0, 50).lineTo(this.id * 50, 60);
		line.graphics.setStrokeStyle(10).moveTo(0, 50).lineTo(this.id * 50, 40);
		player.addChild(face);
		player.addChild(line);
		return player;
	}

	// スター生成
	makeStar(x, y) {
		let star = new createjs.Shape();
		star.graphics.beginFill("yellow");
		star.graphics.beginStroke("black").setStrokeStyle(2);
		star.graphics.drawPolyStar(this.id * 90, 40, 50, 5, 0.6, -90);
		return star;
	}

	// しゃがみモード
	squatMode(x, y) {
		let player = new createjs.Container();
		player.x = x;
		player.y = y;
		let face = new createjs.Shape();
		face.graphics.beginFill(this.color).drawCircle(0, 40, 40);
		let line = new createjs.Shape();
		line.graphics.beginFill(this.color);
		line.graphics.beginStroke(this.color).setStrokeStyle(15);
		line.graphics.moveTo(0, 40).lineTo(0, 150);
		line.graphics.moveTo(0, 142.5).lineTo(this.id * -40, 142.5);
		line.graphics.moveTo(0, 120).lineTo(this.id * 50, 120);
		line.graphics.moveTo(this.id * 42.5, 120).lineTo(this.id * 42.5, 150);
		line.graphics.setStrokeStyle(10).moveTo(0, 90).lineTo(this.id * 50, 90);
		line.graphics.setStrokeStyle(10).moveTo(0, 90).lineTo(this.id * -40, 120);
		player.addChild(face);
		player.addChild(line);
		return player;
	}

	// ローキックモード
	lowKickMode(x, y) {
		let player = new createjs.Container();
		player.x = x;
		player.y = y;
		let face = new createjs.Shape();
		face.graphics.beginFill(this.color).drawCircle(0, 40, 40);
		let line = new createjs.Shape();
		line.graphics.beginFill(this.color);
		line.graphics.beginStroke(this.color).setStrokeStyle(15);
		line.graphics.moveTo(0, 40).lineTo(0, 150);
		line.graphics.moveTo(0, 142.5).lineTo(this.id * -40, 142.5);
		line.graphics.moveTo(0, 120).lineTo(this.id * 70, 120);
		line.graphics.setStrokeStyle(1).moveTo(this.id * 70, 100)
			.lineTo(this.id * 70, 140).lineTo(this.id * 120, 120);
		line.graphics.setStrokeStyle(10).moveTo(0, 90).lineTo(this.id * 50, 90);
		line.graphics.setStrokeStyle(10).moveTo(0, 90).lineTo(this.id * -40, 120);
		player.addChild(face);
		player.addChild(line);
		return player;
	}
}
