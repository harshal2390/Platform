module.exports.home = (req, res) => {
  res.render("home.ejs");
};

module.exports.login = (req, res) => {
  res.render("auth/login.ejs");
};

module.exports.signup = (req, res) => {
  res.render("auth/signup.ejs");
};
