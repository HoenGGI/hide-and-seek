# hide-and-seek

친구 서버용 **게임 모집 디스코드 봇**

## 사용법

```
/모집 게임:롤 인원:5 시간:오늘 9시 메모:즐겜
```

- 🙋 **참여** / 🚪 **나가기** 버튼으로 참여
- 인원이 다 차면 자동 완료 + 참여자 전원 호출
- 🔒 **마감**: 모집장만 가능 (인원 덜 차도 출발)
- 6시간 지나면 자동 마감

## 1. 봇 만들기 (한 번만)

1. https://discord.com/developers/applications → **New Application**
2. 왼쪽 **Bot** → **Reset Token** → 토큰 복사 (절대 남한테 보여주지 말 것)
3. 왼쪽 **OAuth2 → URL Generator**
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Embed Links`
4. 맨 아래 생성된 URL 열어서 친구 서버에 초대

## 2. 설정

```bash
cp .env.example .env
```

`.env` 파일에 토큰 넣기:

```
DISCORD_TOKEN=복사한_토큰
GUILD_ID=서버ID
```

`GUILD_ID`는 선택이지만 넣으면 명령어가 바로 뜸 (안 넣으면 최대 1시간).
서버 ID: 디스코드 설정 → 고급 → 개발자 모드 켜기 → 서버 아이콘 우클릭(길게 누르기) → ID 복사

## 3. 실행

### 안드로이드 폰에서 (Termux)

1. **F-Droid**에서 Termux 설치 (플레이스토어 버전은 오래돼서 안 됨)
2. Termux에서:

```bash
pkg update && pkg install -y python git
git clone https://github.com/HoenGGI/hide-and-seek
cd hide-and-seek
pip install -r requirements.txt
cp .env.example .env
nano .env        # 토큰 입력 후 Ctrl+O, Enter, Ctrl+X
termux-wake-lock # 화면 꺼져도 안 죽게
python bot.py
```

3. 폰 설정 → 앱 → Termux → 배터리 → **제한 없음** 으로 바꾸기

> 폰이 꺼지거나 Termux를 종료하면 봇도 꺼짐. 24시간 켜두려면 아래 서버 방법 추천.

### 아이폰 / 24시간 켜두기 (Railway 등)

1. https://railway.app 에 GitHub로 로그인 → **New Project → Deploy from GitHub repo** → 이 저장소 선택
2. **Variables**에 `DISCORD_TOKEN`, `GUILD_ID` 추가
3. **Settings → Start Command**: `python bot.py`

폰 브라우저만으로 다 할 수 있음.

### 컴퓨터에서

```bash
pip install -r requirements.txt
python bot.py
```
