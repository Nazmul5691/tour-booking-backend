/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
const chatWithAI = async (messages: { role: string; content: string }[]) => {
    const systemMessage = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    const models = [
        "qwen/qwen3.6-plus:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "meta-llama/llama-3.3-70b-instruct:free"
    ];

    for (const model of models) {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 1000,
                    messages: [
                        ...(systemMessage ? [{ role: "system", content: systemMessage.content }] : []),
                        ...chatMessages,
                    ],
                }),
            });

            const data = await response.json();

            // ✅ এই model কাজ করলে return করো
            if (response.ok && data?.choices?.[0]?.message?.content) {
                return data.choices[0].message.content;
            }

            // ❌ কাজ না করলে পরের model try করো
            console.log(`Model ${model} failed, trying next...`);

        } catch (error) {
            console.log(`Model ${model} error, trying next...`);
        }
    }

    return "Sorry, I couldn't understand. Please try again.";
};















// const chatWithAI = async (messages: { role: string; content: string }[]) => {


//     const systemMessage = messages.find((m) => m.role === "system");
//     const chatMessages = messages.filter((m) => m.role !== "system");

//     const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         },
//         // body: JSON.stringify({
//         //     model: "anthropic/claude-3.5-sonnet",
//         //     max_tokens: 1000,
//         //     messages: [
//         //         ...(systemMessage ? [{ role: "system", content: systemMessage.content }] : []),
//         //         ...chatMessages,
//         //     ],
//         // }),
//         body: JSON.stringify({
//             model: "qwen/qwen3.6-plus:free", 
//             max_tokens: 1000,
//             messages: [
//                 ...(systemMessage ? [{ role: "system", content: systemMessage.content }] : []),
//                 ...chatMessages,
//             ],
//         }),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//         throw new Error(data?.error?.message || "AI request failed");
//     }

//     return data?.choices?.[0]?.message?.content || "Sorry, I couldn't understand.";
// };

// export const ChatServices = {
//     chatWithAI,
// };
