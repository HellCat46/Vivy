import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  ModalBuilder,
  SlashCommandSubcommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Vivy } from "../../../Vivy";
import { SimpleError } from "../../../components/EmbedTemplates/Error";
import { decodeJwt } from "jose";

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("login")
    .setDescription("Login with your Anilist Account"),
  async execute(client: Vivy, i: ChatInputCommandInteraction) {
    await i.deferReply({ ephemeral: true });

    const url = `https://anilist.co/api/v2/oauth/authorize?client_id=${client.anilistClient.ClientId}&redirect_url=anilist.co/api/v2/oauth/pin&response_type=code`;

    const Res = await (
      await i.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Anilist Login")
            .setDescription(
              "Go on Authorization Request Page by click the grey button below and `Authorize` Request. After that, You will be redirected to a page where you will see the auth code. Copy It and Come back to discord. Now Click on Login Button and Enter paste your auth Code in the input field."
            )
            .setColor("Green")
            .setTimestamp()
            .setFooter({ text: "This prompt will expire in 60 Seconds" }),
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("Auth Page Link")
              .setStyle(ButtonStyle.Link)
              .setURL(url),
            new ButtonBuilder()
              .setCustomId("loginModal")
              .setLabel("Login")
              .setStyle(ButtonStyle.Secondary)
          ),
        ],
      })
    )
      .awaitMessageComponent({
        filter: (inter) => inter.user.id === i.user.id,
        time: 60_000,
        componentType: ComponentType.Button,
      })
      .then(async (i) => {
        const modal = new ModalBuilder()
          .setCustomId("tokenInput")
          .setTitle("Token Input")
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setRequired(true)
                .setCustomId("token")
                .setLabel("Enter Token Here:")
                .setStyle(TextInputStyle.Paragraph)
            )
          );
        await i.showModal(modal);
        const res = await i
          .awaitModalSubmit({ time: 60_000 })
          .catch(() => null);

        if (res == null) {
          await i.editReply({
            embeds: [SimpleError("Modal Input Expired")],
            components: [],
          });
          return;
        }
        return res;
      })
      .catch(() => null);

    if (!Res) {
      await i.editReply({
        embeds: [SimpleError("Login Prompt Expired")],
        components: [],
      });
      return;
    }
    await i.deleteReply();

    await Res.deferReply({ ephemeral: true });
    try {
      const getAccessToken = await fetch(
        "https://anilist.co/api/v2/oauth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            grant_type: "authorization_code",
            client_id: client.anilistClient.ClientId,
            client_secret: client.anilistClient.ClientSecret,
            redirect_uri: "https://anilist.co/api/v2/oauth/pin",
            code: Res.fields.getTextInputValue("token"),
          }),
        }
      );
      if (getAccessToken.status != 200) {
        await Res.editReply({
          embeds: [
            SimpleError("Failed to get Access Token. Please Try again later"),
          ],
        });
        return;
      }
      const response: { expires_in: number; access_token: string } =
        await getAccessToken.json();

        const jwtPayload = decodeJwt(response.access_token)
        if(typeof jwtPayload.sub !== "string") throw new Error();

      client.accessTokens.set(i.user.id, {
        access_token: response.access_token,
        userId: parseInt(jwtPayload.sub),
        expires_at: Date.now() + response.expires_in * 1000,
      });
      await Res.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Success")
            .setColor("Green")
            .setDescription("Succesfully Logged In")
            .setTimestamp(),
        ],
      });
    } catch (ex) {
      console.log(ex);
      await Res.editReply({
        embeds: [
          SimpleError(
            "Unexpected Error Occured while trying to get Access Token"
          ),
        ],
      });
    }
  },
};
