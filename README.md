# Kakugame

## Deployment

```
$ python3 run.py
```

## Deployment

```
$ heroku login
$ heroku create <App Name>
$ heroku container:push --app <App Name> web
$ heroku container:release web --app <App Name>
```

## 操作方法

- スペースキーまたはクリックでラウンド開始
- 3ラウンド制
- 体力が一定以下になるとレイジ状態へ移行

### LEFT

| 行動 | コマンド |
|:----:|:----:|
| 左移動 | A |
| 右移動 | D |
| ジャンプ | W |
| しゃがむ | S |
| 攻撃 | G |

### RIGHT

| 行動 | コマンド |
|:----:|:----:|
| 左移動 | ← |
| 右移動 | → |
| ジャンプ | ↑ |
| しゃがむ | ↓ |
| 攻撃 | Enter |

*1 : テンキー

### 技表

| 技名 | コマンド |
|:----:|:----:|
| ミドルパンチ | 攻撃 <sup>*2</sup> |
| ローキック | しゃがみ中 攻撃 |
| 上段レイジドライブ | レイジ中 攻撃 ↑ |
| 下段レイジドライブ | レイジ中 攻撃 ↓ |

*2 : ジャンプ中も可
