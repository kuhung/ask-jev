import { DecisionMode, InspirationItem, JevDecisionData } from './types';

export const INSPIRATION_ITEMS: InspirationItem[] = [
  { q: "6000块的苹果新机现在买不买？", mode: "yes_no", context: "手头的iPhone 13电池健康81%，还能凑合用。" },
  { q: "中午吃骨汤麻辣烫还是轻食鸡胸肉沙拉？", mode: "choice", context: "最近在控糖减脂，但是今天上午加班心情烦闷。" },
  { q: "周五下班部门聚餐去不去？", mode: "yes_no", context: "AA制每人150元，主要是听领导吹牛，周六还想早起跑步。" },
  { q: "3000块的健身房年卡要不要办？", mode: "yes_no", context: "离家800米，过去两年办的卡平均一年只去了三次。" },
  { q: "买了一年没穿的呢子大衣要不要挂闲鱼？", mode: "yes_no", context: "原价1200买的，挂闲鱼估计只能卖150，觉得亏。" },
  { q: "晚上喝一杯全糖热奶茶犒劳一下？", mode: "yes_no", context: "今天走了12000步，刚刚改完方案。" },
  { q: "冲动想辞职去大理租个院子摆摊卖手冲", mode: "score", context: "存款大概够支撑6个月生活，没有摆摊经验。" },
  { q: "周末自驾去露营还是宅在家里打游戏？", mode: "choice", context: "天气预报多云微风，但是平时上班已经很累了。" },
  { q: "前同事下周结婚要不要随500块礼金？", mode: "yes_no", context: "在上一家公司共事一年半，离职后大半年没说过话。" },
  { q: "戴森洗地机有必要买吗？", mode: "yes_no", context: "家里主要是地板，平时用普通扫把和拖把，感觉有点累。" }
];

interface KnowledgePattern {
  triggers: string[];
  verdict: string;
  tag: string;
  badgeClass: 'red' | 'green' | 'gold';
  reason: string;
}

const LOCAL_KNOWLEDGE = {
  yes_no: [
    {
      triggers: ["买", "入", "换", "购", "苹果", "手机", "相机", "耳机", "手表"],
      verdict: "坚决别买！",
      tag: "理智保卫",
      badgeClass: "red" as const,
      reason: "你现在强烈的渴望其实源于生活枯燥带来的冲动消费欲。你以前买来吃灰的大件还在墙角落灰。先加入购物车放满7天，7天后你大概率连它是啥都忘了。把钱留在兜里带来的安全感，远胜拆快递那10分钟的虚假多巴胺。"
    },
    {
      triggers: ["卡", "课", "健身", "培训", "会员"],
      verdict: "千万别办！",
      tag: "避坑指南",
      badgeClass: "red" as const,
      reason: "指望通过一次性付费来购买自律，是消费主义最温柔的陷阱。过去办的年卡平均单次成本已经突破天际。真想练，先坚持连续两周每天下楼快走30分钟，做到了再去谈办卡。"
    },
    {
      triggers: ["聚餐", "团建", "去不去", "参加", "婚礼", "饭局", "聚会"],
      verdict: "果断别去！",
      tag: "拒绝内耗",
      badgeClass: "red" as const,
      reason: "凡是让你在去之前就感到犹豫拉扯的社交，90%去了都是如坐针毡。消耗两小时宝贵周末去迎合尴尬的客套，周一上班会加倍疲倦。果断礼貌找个借口推掉，宅家享受独处时光更香。"
    },
    {
      triggers: ["扔", "闲鱼", "卖", "断舍离", "留"],
      verdict: "立刻挂闲鱼！",
      tag: "断舍离",
      badgeClass: "green" as const,
      reason: "如果一件东西超过半年没碰过，它在你的生活里就已经死亡了。不肯放手只是在为过去的沉没成本买单。变现成哪怕几十块钱的现金，都比让它在屋里白占一平米几万块的空间划算得多。"
    },
    {
      triggers: ["吃", "喝", "奶茶", "夜宵", "犒劳"],
      verdict: "果断冲一单！",
      tag: "心理抚慰",
      badgeClass: "green" as const,
      reason: "管家看你今天已经被生活折磨得够呛了。偶尔一杯奶茶或一顿夜宵毁不掉你的健康，但紧绷到极限的心态一定会拖垮你的精力。去买少糖少冰的，喝完今晚好好睡一觉！"
    }
  ],
  choice: [
    {
      triggers: ["麻辣烫", "沙拉", "轻食"],
      verdict: "去吃麻辣烫！",
      tag: "实事求是",
      badgeClass: "gold" as const,
      reason: "心情不好的时候硬逼自己嚼干瘪无味的生冷菜叶，下午大概率会因为心理空虚而报复性狂点高热量零食。去吃一碗骨汤麻辣烫，多涮白菜、香菇和牛肉，少放红油麻酱，兼顾抚慰与健康。"
    },
    {
      triggers: ["外卖", "下楼", "食堂"],
      verdict: "起身下楼吃！",
      tag: "打破僵化",
      badgeClass: "gold" as const,
      reason: "你在工位上坐了一上午，血液都快凝固了。下楼走那两百米晒晒太阳吹吹风，哪怕只是去便利店买个便当，也能让大脑从工作死循环里重启出来。"
    },
    {
      triggers: ["露营", "宅", "游戏"],
      verdict: "宅家打游戏！",
      tag: "舒适优先",
      badgeClass: "gold" as const,
      reason: "露营准备装备两小时、扎营收帐篷三小时，回来洗车洗垫子还要一天。现在的你最缺的是无需向任何人证明的彻底放松。拉上窗帘，打开游戏，给身心做一次真正的减负。"
    }
  ],
  score: [
    {
      triggers: ["辞职", "摆摊", "大理", "开店"],
      score: 8,
      verdict: "冲动指数 8 分",
      tag: "极高风险",
      badgeClass: "red" as const,
      reason: "把对当下工作的厌倦投射到风花雪月的摆摊创业上，是最常见的逃避陷阱。摆摊同样有日晒雨淋和入不敷出。管家建议：先把摆摊当成周末副业试水两次，赚到第一张百元大钞再谈辞职。"
    }
  ]
};

export function runMockJevInference(
  question: string,
  mode: DecisionMode,
  context?: string
): JevDecisionData {
  const cleanQ = question.toLowerCase();
  const signId = Math.floor(1000 + Math.random() * 9000);

  if (mode === 'yes_no') {
    for (const item of LOCAL_KNOWLEDGE.yes_no) {
      if (item.triggers.some(t => cleanQ.includes(t))) {
        return {
          mode,
          verdict: item.verdict,
          verdictTag: item.tag,
          badgeClass: item.badgeClass,
          reasoning: item.reason,
          signId
        };
      }
    }
    const isYes = Math.random() > 0.5;
    return {
      mode,
      verdict: isYes ? "果断去办！" : "坚决别干！",
      verdictTag: isYes ? "机不可失" : "劝退止损",
      badgeClass: isYes ? "green" : "red",
      reasoning: isYes
        ? "你纠结这么久，说明内心深处早已有了倾向，只是缺乏临门一脚的勇气。去办吧，哪怕结果不够完美，也比日后不断反刍后悔更有生命力。"
        : "真正值得做的事你早就兴奋地开工了，绝不会拖到现在到处找人问。现在的不甘心只是沉没成本在作祟。立刻停下，去干点踏实的正事。",
      signId
    };
  }

  if (mode === 'choice') {
    for (const item of LOCAL_KNOWLEDGE.choice) {
      if (item.triggers.some(t => cleanQ.includes(t))) {
        return {
          mode,
          verdict: item.verdict,
          verdictTag: item.tag,
          badgeClass: item.badgeClass,
          reasoning: item.reason,
          signId
        };
      }
    }
    const parts = question.split(/还是|或者|vs|VS|\/|、/);
    let chosen = "第一项";
    if (parts.length >= 2) {
      chosen = parts[Math.floor(Math.random() * parts.length)].trim();
    }
    return {
      mode,
      verdict: `首选：${chosen}！`,
      verdictTag: "最优解",
      badgeClass: "gold",
      reasoning: `综合你的现状，选「${chosen}」在当下带来的情绪价值与决策确定感最高。不要再滑动屏幕比来比去了，听管家的，直接定下来！`,
      signId
    };
  }

  // score 模式
  const scoreVal = Math.floor(Math.random() * 4) + 6;
  return {
    mode,
    score: scoreVal,
    verdict: `冲动指数 ${scoreVal} 分`,
    verdictTag: "冲动预警",
    badgeClass: "red",
    reasoning: "经过老管家多维度心理推演，你当下的念头冲动成分占了绝大部分。这往往是压力过载时的应激性幻想。先让自己深呼吸三分钟，把计划写在纸上睡一觉再看。",
    signId
  };
}
