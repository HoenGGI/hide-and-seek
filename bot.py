import os

import discord
from discord import app_commands
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")
# 서버 ID를 넣으면 슬래시 명령어가 그 서버에 즉시 등록됨 (비우면 전체 등록, 최대 1시간 걸림)
GUILD_ID = os.getenv("GUILD_ID")

# 모집 버튼이 살아있는 시간 (초). 지나면 자동 마감.
RECRUIT_TIMEOUT = 6 * 60 * 60


class RecruitView(discord.ui.View):
    def __init__(self, host: discord.Member, game: str, size: int, when: str | None, memo: str | None):
        super().__init__(timeout=RECRUIT_TIMEOUT)
        self.host = host
        self.game = game
        self.size = size
        self.when = when
        self.memo = memo
        self.members: list[discord.Member] = [host]
        self.closed = False
        self.message: discord.Message | None = None

    def build_embed(self) -> discord.Embed:
        full = len(self.members) >= self.size
        if self.closed:
            title, color = f"🔒 [마감] {self.game}", discord.Color.dark_grey()
        elif full:
            title, color = f"✅ [완료] {self.game}", discord.Color.green()
        else:
            title, color = f"🎮 {self.game} 같이 할 사람!", discord.Color.blurple()

        embed = discord.Embed(title=title, color=color)
        embed.add_field(name="모집장", value=self.host.mention)
        embed.add_field(name="인원", value=f"{len(self.members)} / {self.size}")
        if self.when:
            embed.add_field(name="시간", value=self.when)
        if self.memo:
            embed.add_field(name="메모", value=self.memo, inline=False)
        embed.add_field(
            name="참여자",
            value="\n".join(f"{i}. {m.mention}" for i, m in enumerate(self.members, 1)),
            inline=False,
        )
        return embed

    def disable_all(self):
        for item in self.children:
            item.disabled = True

    async def finish(self, interaction: discord.Interaction):
        """인원이 다 차거나 모집장이 마감했을 때 참여자 전원 호출."""
        self.disable_all()
        self.stop()
        await interaction.response.edit_message(embed=self.build_embed(), view=self)
        mentions = " ".join(m.mention for m in self.members)
        await interaction.followup.send(f"📢 **{self.game}** 모였어요! 출발~ {mentions}")

    @discord.ui.button(label="참여", style=discord.ButtonStyle.success, emoji="🙋")
    async def join(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user in self.members:
            await interaction.response.send_message("이미 참여 중이에요!", ephemeral=True)
            return
        self.members.append(interaction.user)
        if len(self.members) >= self.size:
            await self.finish(interaction)
        else:
            await interaction.response.edit_message(embed=self.build_embed(), view=self)

    @discord.ui.button(label="나가기", style=discord.ButtonStyle.secondary, emoji="🚪")
    async def leave(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user == self.host:
            await interaction.response.send_message("모집장은 나갈 수 없어요. 대신 '마감'을 눌러주세요.", ephemeral=True)
            return
        if interaction.user not in self.members:
            await interaction.response.send_message("참여하지 않았어요.", ephemeral=True)
            return
        self.members.remove(interaction.user)
        await interaction.response.edit_message(embed=self.build_embed(), view=self)

    @discord.ui.button(label="마감", style=discord.ButtonStyle.danger, emoji="🔒")
    async def close(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user != self.host:
            await interaction.response.send_message("모집장만 마감할 수 있어요.", ephemeral=True)
            return
        self.closed = True
        await self.finish(interaction)

    async def on_timeout(self):
        self.closed = True
        self.disable_all()
        if self.message:
            try:
                await self.message.edit(embed=self.build_embed(), view=self)
            except discord.HTTPException:
                pass


class Bot(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.default())
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self):
        if GUILD_ID:
            guild = discord.Object(id=int(GUILD_ID))
            self.tree.copy_global_to(guild=guild)
            await self.tree.sync(guild=guild)
        else:
            await self.tree.sync()

    async def on_ready(self):
        print(f"로그인 완료: {self.user}")


bot = Bot()


@bot.tree.command(name="모집", description="게임 같이 할 사람 모으기")
@app_commands.describe(
    게임="무슨 게임? (예: 롤, 배그, 발로란트)",
    인원="나 포함 총 몇 명?",
    시간="언제? (예: 오늘 9시, 지금 바로)",
    메모="하고 싶은 말 (예: 랭겜, 즐겜)",
)
async def recruit(
    interaction: discord.Interaction,
    게임: str,
    인원: app_commands.Range[int, 2, 30],
    시간: str | None = None,
    메모: str | None = None,
):
    view = RecruitView(interaction.user, 게임, 인원, 시간, 메모)
    await interaction.response.send_message(embed=view.build_embed(), view=view)
    view.message = await interaction.original_response()


if __name__ == "__main__":
    if not TOKEN:
        raise SystemExit(".env 파일에 DISCORD_TOKEN을 넣어주세요.")
    bot.run(TOKEN)
