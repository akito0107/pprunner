import {
  Avatar,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Collapse,
  Grid,
  IconButton,
  Typography
} from "@material-ui/core";
import { red } from "@material-ui/core/colors";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import FavoriteIcon from "@material-ui/icons/Favorite";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import ShareIcon from "@material-ui/icons/Share";
import { makeStyles } from "@material-ui/styles";
import classnames from "classnames";
import Link from "next/link";
import { useState } from "react";
import Layout from "../components/layout";

function Page() {
  const classes = makeStyles({
    card: {
      maxWidth: 400
    },
    media: {
      height: 0,
      paddingTop: "56.25%" // 16:9
    },
    actions: {
      display: "flex"
    },
    expand: {
      transform: "rotate(0deg)",
      marginLeft: "auto"
    },
    expandOpen: {
      transform: "rotate(180deg)"
    },
    avatar: {
      backgroundColor: red[500]
    }
  })();

  const [expanded, setExpanded] = useState(false);

  return (
    <Layout>
      <Grid item={true}>
        <Card className={classes.card}>
          <CardHeader
            avatar={
              <Avatar aria-label="Recipe" className={classes.avatar}>
                G
              </Avatar>
            }
            action={
              <IconButton>
                <MoreVertIcon />
              </IconButton>
            }
            title="Gopher Academy"
            subheader="September 14, 2016"
          />
          <CardMedia
            className={classes.media}
            image="/static/images/index.png"
            title="Gopher Academy"
          />
          <CardContent>
            <Typography component="p">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla
            </Typography>
          </CardContent>
          <CardActions className={classes.actions} disableActionSpacing={true}>
            <IconButton aria-label="Add to favorites">
              <FavoriteIcon />
            </IconButton>
            <IconButton aria-label="Share">
              <ShareIcon />
            </IconButton>
            <IconButton
              className={classnames(classes.expand, {
                [classes.expandOpen]: expanded
              })}
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label="Show more"
              data-test-target="expand-link"
            >
              <ExpandMoreIcon />
            </IconButton>
          </CardActions>
          <Collapse in={expanded} timeout="auto" unmountOnExit={true}>
            <Link href={`/form`}>
              <a data-test-target="click-point">show form</a>
            </Link>
          </Collapse>
        </Card>
      </Grid>
      <Grid item={true}>
        <Card className={classes.card}>
          <CardHeader
            avatar={
              <Avatar aria-label="Recipe" className={classes.avatar}>
                G
              </Avatar>
            }
            action={
              <IconButton>
                <MoreVertIcon />
              </IconButton>
            }
            title="7th Birthday!"
            subheader="September 14, 2016"
          />
          <CardMedia
            className={classes.media}
            image="/static/images/7th.png"
            title="Gopher Academy"
          />
          <CardContent>
            <Typography component="p">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla
            </Typography>
          </CardContent>
          <CardActions className={classes.actions} disableActionSpacing={true}>
            <IconButton aria-label="Add to favorites">
              <FavoriteIcon />
            </IconButton>
            <IconButton aria-label="Share">
              <ShareIcon />
            </IconButton>
          </CardActions>
        </Card>
      </Grid>
    </Layout>
  );
}

export default Page;
