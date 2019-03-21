import { Grid } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/styles";
import Head from "next/head";
import * as React from "react";
import { theme } from "../module/theme";
import Header from "./header";

export default function Layout({
  children,
  title = "default"
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>{title}</title>

        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
      </Head>
      <header>
        <Header />
      </header>
      <body>
        <Grid container={true} spacing={16}>
          {children}
        </Grid>
      </body>
    </ThemeProvider>
  );
}
