// addTestBalance.js
const { exec } = require("child_process");

// CHANGE THIS: path to your stripe.exe
const stripeCLIPath = "E:\\Downloads\\stripe.exe";

// CHANGE THIS: how much total you want available in USD
const targetBalance = 1000;

// amount each trigger adds
const increment = 20;

let added = 0;

function addBalance() {
  if (added >= targetBalance) {
    console.log(`✅ Target balance of $${targetBalance} reached!`);
    return;
  }

  console.log(`Adding $${increment} to available balance...`);

  exec(
    `${stripeCLIPath} trigger balance.available`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error adding balance: ${error.message}`);
        return;
      }
      if (stderr) console.error(stderr);

      console.log(stdout);
      added += increment;

      // wait 1s between triggers to avoid overlap
      setTimeout(addBalance, 1000);
    }
  );
}

addBalance();
