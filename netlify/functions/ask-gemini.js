// 文件路径: netlify/functions/ask-gemini.js

// 这是一个 Node.js 环境
exports.handler = async (event) => {
  // 1. 安全地从 Netlify 环境变量中获取你的 API Key
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // 如果没有设置 API Key，返回错误
  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY is not set.' })
    };
  }

  // 2. 从前端请求中获取用户输入的内容
  let userPrompt;
  try {
    userPrompt = JSON.parse(event.body).prompt;
    if (!userPrompt) throw new Error();
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing or invalid "prompt" in request body.' })
    };
  }

  // 3. 构造请求，从这里安全地调用 Google Gemini API
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: userPrompt
          }]
        }]
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        return {
            statusCode: response.status,
            body: JSON.stringify({ error: 'Failed to fetch from Gemini API.', details: errorData })
        };
    }

    const geminiData = await response.json();
    
    // 4. 将从 Gemini 获取的结果返回给前端
    return {
      statusCode: 200,
      body: JSON.stringify(geminiData),
    };

  } catch (error) {
    console.error('Internal Server Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An internal error occurred.' }),
    };
  }
};