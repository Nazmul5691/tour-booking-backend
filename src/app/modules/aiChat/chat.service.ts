
const chatWithAI = async (messages: { role: string; content: string }[]) => {
    
    // system message আলাদা করুন
    const systemMessage = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
            model: "anthropic/claude-3.5-sonnet",
            max_tokens: 1000,
            messages: [
                // system prompt প্রথমে
                ...(systemMessage ? [{ role: "system", content: systemMessage.content }] : []),
                ...chatMessages,
            ],
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error?.message || "AI request failed");
    }

    return data?.choices?.[0]?.message?.content || "Sorry, I couldn't understand.";
};

export const ChatServices = {
    chatWithAI,
};