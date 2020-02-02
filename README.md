# アレクサ、電気を付けて

を実現するlambda functionです。  
alex -> lambda -> ifttt(Webhook) -> irkit という経路で信号を送ります。

# デプロイ方法

github actinoを使っています。  
masterにpushするだけで自動デプロイします。

# 秘密情報の管理

github actionでつかうAWSのcredentialはgithub secretsで、  
lambdaの中で使うiftttのキーはAWS System Mangerのパラメータストアを使っています。

github secretsには以下のパラメータを設定してください。

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

AWS System Managerのパラメータストアには以下を設定してください。

- ifttt_key
  - iftttのAPIコールに必要な鍵文字列
- ifttt_living_light_on
  - 電気をつけるWebhookの名前
- ifttt_living_light_off
  - 電気を消すWebhookの名前

