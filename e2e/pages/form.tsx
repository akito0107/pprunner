import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField
} from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import { makeStyles } from "@material-ui/styles";
import { useField, useForm } from "react-final-form-hooks";
import Layout from "../components/layout";
import { theme } from "../module/theme";

async function onSubmit() {
  return true;
}

function validate() {
  return {};
}

function Page() {
  const classes = makeStyles({
    container: {
      display: "flex",
      flexWrap: "wrap"
    },
    textField: {
      width: "100%",
      marginLeft: theme.spacing.unit,
      marginRight: theme.spacing.unit
    },
    formControl: {
      margin: theme.spacing.unit,
      minWidth: 120
    },
    selectEmpty: {
      marginTop: theme.spacing.unit * 2
    },
    dense: {
      marginTop: 16
    },
    menu: {
      width: 200
    },
    group: {
      margin: `${theme.spacing.unit}px 0`
    }
  })();
  const { form } = useForm({
    onSubmit, // the function to call with your form values upon valid submit
    validate // a record-level validation function to check all form values
  });
  const firstName = useField("firstName", form);
  const lastName = useField("lastName", form);
  const info = useField("info", form);
  const age = useField("age", form);

  return (
    <Layout>
      <form className={classes.container}>
        <Grid item={true} xs={6}>
          <TextField
            label="firstName"
            className={classes.textField}
            margin="normal"
            variant="outlined"
            {...firstName.input}
          />
        </Grid>
        <Grid item={true} xs={6}>
          <TextField
            label="lastName"
            className={classes.textField}
            margin="normal"
            variant="outlined"
            {...lastName.input}
          />
        </Grid>

        <Grid item={true} xs={12}>
          <TextField
            label="info"
            placeholder="Placeholder"
            multiline={true}
            className={classes.textField}
            margin="normal"
            variant="outlined"
            {...info.input}
          />
        </Grid>
        <Grid item={true} xs={4}>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="age-simple">Age</InputLabel>
            <Select
              inputProps={{
                name: "age",
                id: "age-simple"
              }}
              {...age.input}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value={10}>Ten</MenuItem>
              <MenuItem value={20}>Twenty</MenuItem>
              <MenuItem value={30}>Thirty</MenuItem>
            </Select>
          </FormControl>
          <Grid item={true} xs={8}>
            <FormControl
              component={"fieldset" as "div"}
              className={classes.formControl}
            >
              <FormLabel component={"legend" as "label"}>Gender</FormLabel>
              <RadioGroup
                aria-label="Gender"
                name="gender"
                className={classes.group}
              >
                <FormControlLabel
                  value="female"
                  control={<Radio />}
                  label="Female"
                />
                <FormControlLabel
                  value="male"
                  control={<Radio />}
                  label="Male"
                />
                <FormControlLabel
                  value="other"
                  control={<Radio />}
                  label="Other"
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item={true} xs={12}>
            <FormControl
              component={"fieldset" as "div"}
              className={classes.formControl}
            >
              <FormLabel component={"legend" as "label"}>Hobby</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={<Checkbox value="gilad" />}
                  label="music"
                />
                <FormControlLabel
                  control={<Checkbox value="jason" />}
                  label="camera"
                />
                <FormControlLabel
                  control={<Checkbox value="antoine" />}
                  label="picture"
                />
              </FormGroup>
            </FormControl>
          </Grid>
        </Grid>
      </form>
    </Layout>
  );
}

export default Page;
