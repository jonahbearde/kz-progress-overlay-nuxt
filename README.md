# kz-progress-overlay

Display real-time progress and ranking information from kz races.

## How to use

You need to set up [GSI Socket](https://bitbucket.org/Sikarii/gsisocket/src/master/) to be able to receive information on the server. Make sure you have nodejs(20.19+ or 22.12+) installed.

- Install pnpm using `npm i -g pnpm`.

- Run `pnpm i`.

- In the `.env` file, fill in `NUXT_STEAM_API_KEY` with your own [Steam web api key](https://steamcommunity.com/dev/apikey) and `NUXT_PUBLIC_GSI_SERVER` with the GSI websocket address.

- Run `pnpm dev` to start a web page.

- Add the web page as a browser source in your streaming software.
