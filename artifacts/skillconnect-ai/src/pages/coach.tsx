import { useState, useRef, useEffect } from "react";
import { useListCoachConversations, useCreateCoachConversation, useGetCoachConversation } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Send, User, Bot, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Coach() {
  const qc = useQueryClient();
  const { data: conversations, isLoading: loadingConvos, refetch: refetchConvos } = useListCoachConversations();
  const createConvo = useCreateCoachConversation();
  
  const [activeId, setActiveId] = useState<number | null>(null);
  const { data: activeConvo, isLoading: loadingMsgs } = useGetCoachConversation(activeId as number, { query: { enabled: !!activeId } as any });
  
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-select first conversation
  useEffect(() => {
    if (conversations?.length && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  // Scroll to bottom on messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConvo?.messages, streamedResponse]);

  const handleNewConversation = () => {
    createConvo.mutate({ data: { title: "New Conversation" } }, {
      onSuccess: (res) => {
        setActiveId(res.id);
        refetchConvos();
      }
    });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeId || isStreaming) return;

    const content = input;
    setInput("");
    setIsStreaming(true);
    setStreamedResponse("");

    // Optimistically add user message via cache
    qc.setQueryData([`/api/coach/conversations/${activeId}`], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        messages: [...old.messages, { id: Date.now(), role: "user", content, createdAt: new Date().toISOString() }]
      };
    });

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/coach/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      let textBuffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.delta) {
                  textBuffer += data.delta;
                  setStreamedResponse(textBuffer);
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
      setStreamedResponse("");
      qc.invalidateQueries({ queryKey: [`/api/coach/conversations/${activeId}`] });
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-6 animate-in fade-in">
      <Card className="w-80 flex flex-col overflow-hidden border-border/50 shadow-md">
        <div className="p-4 border-b bg-muted/20">
          <Button onClick={handleNewConversation} className="w-full rounded-full shadow-sm" disabled={createConvo.isPending}>
            <Plus className="w-4 h-4 mr-2" /> New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          {conversations?.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`w-full text-left p-3 rounded-xl mb-1 transition-colors text-sm ${
                activeId === conv.id ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate">{conv.title}</span>
              </div>
            </button>
          ))}
        </ScrollArea>
      </Card>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-primary/10 relative">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
            <Bot className="w-12 h-12 text-primary/30" />
            <p>Select a conversation or start a new one to chat with your AI Career Coach.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
              {activeConvo?.messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-2xl ${msg.role === "user" ? "bg-secondary/10 text-foreground rounded-tr-sm" : "bg-primary/5 border border-primary/10 rounded-tl-sm"}`}>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {isStreaming && streamedResponse && (
                <div className="flex gap-4 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-primary text-primary-foreground">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 rounded-tl-sm">
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{streamedResponse}<span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" /></p>
                  </div>
                </div>
              )}
              {isStreaming && !streamedResponse && (
                 <div className="flex gap-4 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-primary text-primary-foreground">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 rounded-tl-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Coach is thinking...</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-card mt-auto">
              <form onSubmit={sendMessage} className="relative flex items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask for advice, resume tips, or interview practice..."
                  className="pr-12 py-6 rounded-2xl bg-muted/50 border-transparent focus-visible:ring-primary/30 text-base"
                  disabled={isStreaming}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="absolute right-2 h-10 w-10 rounded-xl rounded-tl-sm rounded-br-sm shadow-md"
                  disabled={!input.trim() || isStreaming}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
