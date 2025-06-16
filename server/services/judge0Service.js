const axios = require("axios");

const executeCode = async (sourceCode, languageId = 63) => {
  try {
    console.log("Submitting code to Judge0 with languageId:", languageId); // Debug log
    const submission = await axios.post(
      `${process.env.JUDGE0_API_URL}?base64_encoded=true`,
      {
        source_code: Buffer.from(sourceCode).toString("base64"),
        language_id: languageId,
        stdin: Buffer.from("").toString("base64"),
      },
      {
        headers: {
          "x-rapidapi-key": process.env.JUDGE0_API_KEY,
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );
    console.log("Judge0 submission successful, token:", submission.data.token);

    let result;
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      result = await axios.get(
        `${process.env.JUDGE0_API_URL}/${submission.data.token}?base64_encoded=true`,
        {
          headers: {
            "x-rapidapi-key": process.env.JUDGE0_API_KEY,
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          },
          timeout: 5000,
        }
      );
      console.log("Poll attempt", i+1, "status:", result.data.status); // Debug log
      if (result.data.status.id > 2) break;
    }
    if (!result || result.data.status.id >= 6) {
      // 6+ = error states including Compilation Error
      throw new Error(
        `Execution failed with status: ${
          result?.data.status.description || "unknown"
        }, Details: ${JSON.stringify(result?.data || {})}`
      );
    }
    return {
      output: result.data.stdout
        ? Buffer.from(result.data.stdout, "base64").toString()
        : "",
      error: result.data.stderr
        ? Buffer.from(result.data.stderr, "base64").toString()
        : "",
      time: result.data.time || "N/A",
    };
  } catch (error) {
    console.error(
      "Judge0 error:",
      error.response?.status,
      error.response?.data || error.message
    );
    return { error: `Code execution failed: ${error.message}` };
  }
};

module.exports = { executeCode };
