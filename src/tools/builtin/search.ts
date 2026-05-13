import type { Tool } from "../types.ts";

export const searchTool:Tool={
    definition:{
        name:"search",
        description:"Search the internet for information.",
        parameters:{
            type:"object",
            properties:{
                query:{
                    type:"string",
                    description:"The search query."
                }
            },
            required:["query"]
        }
    },
    async execute(args:Record<string,unknown>):Promise<string>{
        //获取参数
        const query = args.query as string;
        return `我从互联网上搜索到了${query}相关的内容`;
    }
}