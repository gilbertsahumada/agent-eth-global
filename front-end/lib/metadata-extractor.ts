/**
 * Automatic Metadata Extractor
 *
 * Analyzes markdown content to automatically extract:
 * - Tech Stack (frameworks, libraries, tools)
 * - Keywords (relevant terms)
 * - Domain (DeFi, NFT, Infrastructure, etc.)
 * - Programming Languages (from code blocks)
 */

interface ExtractedMetadata {
  techStack: string[];
  keywords: string[];
  domain: string | null;
  languages: string[];
  description: string;
}

// Known tech patterns
const TECH_PATTERNS = {
  // Blockchain & Smart Contracts
  solidity: /\b(solidity|pragma solidity)\b/gi,
  hardhat: /\b(hardhat|@nomiclabs\/hardhat)\b/gi,
  truffle: /\btruffle\b/gi,
  foundry: /\b(foundry|forge|cast)\b/gi,
  openzeppelin: /\b(openzeppelin|@openzeppelin)\b/gi,
  ethers: /\b(ethers\.js|ethers)\b/gi,
  web3: /\bweb3(\.js)?\b/gi,

  // Frontend
  react: /\b(react|react\.js|next\.js|nextjs)\b/gi,
  vue: /\b(vue|vue\.js|nuxt)\b/gi,
  angular: /\bangular\b/gi,

  // Backend
  node: /\b(node\.js|nodejs|express)\b/gi,
  python: /\b(python|django|flask|fastapi)\b/gi,

  // Oracles & Data
  chainlink: /\bchainlink\b/gi,
  thegraph: /\b(the graph|graph protocol|subgraph)\b/gi,

  // Testing
  mocha: /\bmocha\b/gi,
  chai: /\bchai\b/gi,
  jest: /\bjest\b/gi,
  waffle: /\bwaffle\b/gi,

  // Tools
  metamask: /\bmetamask\b/gi,
  ipfs: /\bipfs\b/gi,
  docker: /\bdocker\b/gi,
};

// Domain keywords
const DOMAIN_PATTERNS = {
  DeFi: [
    /\b(defi|decentralized finance|dex|liquidity|yield|staking|lending|amm|swap)\b/gi,
  ],
  NFT: [/\b(nft|erc-?721|erc-?1155|non-fungible|collectible|marketplace)\b/gi],
  Gaming: [/\b(game|gaming|play-to-earn|p2e|metaverse)\b/gi],
  Infrastructure: [
    /\b(infrastructure|node|validator|consensus|scaling|l2|layer 2|rollup)\b/gi,
  ],
  Oracles: [/\b(oracle|chainlink|data feed|price feed|vrf|random)\b/gi],
  "Smart Contracts": [
    /\b(smart contract|solidity|evm|contract|deployment)\b/gi,
  ],
  Tools: [/\b(sdk|cli|library|framework|tool|development)\b/gi],
  DAO: [/\b(dao|governance|voting|proposal)\b/gi],
};

// Common keywords to extract
const KEYWORD_PATTERNS = [
  /\b(deploy|deployment|compile|test|verify|audit)\b/gi,
  /\b(contract|interface|library|function|method)\b/gi,
  /\b(token|erc20|erc721|erc1155)\b/gi,
  /\b(wallet|transaction|gas|fee)\b/gi,
  /\b(event|emit|modifier|require)\b/gi,
  /\b(install|setup|configure|initialize)\b/gi,
  /\b(api|endpoint|request|response)\b/gi,
];

export class MetadataExtractor {
  /**
   * Extract all metadata from markdown content
   */
  static extract(content: string, frontmatter?: any): ExtractedMetadata {
    const techStack = this.extractTechStack(content);
    const keywords = this.extractKeywords(content);
    const domain = this.inferDomain(content);
    const languages = this.extractLanguages(content);
    const description = this.generateDescription(content, frontmatter);

    return {
      techStack: Array.from(new Set(techStack)), // Remove duplicates
      keywords: Array.from(new Set(keywords)),
      domain,
      languages: Array.from(new Set(languages)),
      description,
    };
  }

  /**
   * Extract tech stack from content
   */
  private static extractTechStack(content: string): string[] {
    const detected: string[] = [];

    for (const [tech, pattern] of Object.entries(TECH_PATTERNS)) {
      if (pattern.test(content)) {
        // Capitalize properly
        const formatted = tech
          .split(/(?=[A-Z])/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        detected.push(formatted);
      }
    }

    return detected;
  }

  /**
   * Extract keywords from content
   */
  private static extractKeywords(content: string): string[] {
    const keywords: Set<string> = new Set();

    // Extract from patterns
    for (const pattern of KEYWORD_PATTERNS) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        keywords.add(match[0].toLowerCase());
      }
    }

    // Extract from headings (H1, H2, H3)
    const headingMatches = content.matchAll(/^#{1,3}\s+(.+)$/gm);
    for (const match of headingMatches) {
      const words = match[1]
        .split(/\s+/)
        .filter((word) => word.length > 3 && !/^[0-9]+$/.test(word));
      words.forEach((word) => keywords.add(word.toLowerCase()));
    }

    // Limit to top 20 most relevant keywords
    return Array.from(keywords).slice(0, 20);
  }

  /**
   * Infer domain from content
   */
  private static inferDomain(content: string): string | null {
    const scores: { [key: string]: number } = {};

    for (const [domain, patterns] of Object.entries(DOMAIN_PATTERNS)) {
      let score = 0;
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          score += matches.length;
        }
      }
      scores[domain] = score;
    }

    // Get domain with highest score
    const entries = Object.entries(scores);
    if (entries.length === 0) return null;

    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return sorted[0][1] > 0 ? sorted[0][0] : null;
  }

  /**
   * Extract programming languages from code blocks
   */
  private static extractLanguages(content: string): string[] {
    const languages: Set<string> = new Set();

    // Match code blocks with language specifier
    const codeBlockPattern = /```(\w+)/g;
    const matches = content.matchAll(codeBlockPattern);

    for (const match of matches) {
      const lang = match[1].toLowerCase();
      // Normalize language names
      const normalized = this.normalizeLanguage(lang);
      if (normalized) {
        languages.add(normalized);
      }
    }

    return Array.from(languages);
  }

  /**
   * Normalize language names
   */
  private static normalizeLanguage(lang: string): string | null {
    const langMap: { [key: string]: string } = {
      js: "javascript",
      ts: "typescript",
      sol: "solidity",
      py: "python",
      rs: "rust",
      go: "go",
      sh: "shell",
      bash: "shell",
      json: "json",
      yaml: "yaml",
      yml: "yaml",
      md: "markdown",
      solidity: "solidity",
      javascript: "javascript",
      typescript: "typescript",
    };

    return langMap[lang] || lang;
  }

  /**
   * Generate auto-description from content
   */
  private static generateDescription(
    content: string,
    frontmatter?: any
  ): string {
    // Check frontmatter first
    if (frontmatter?.description) {
      return frontmatter.description;
    }

    // Get first paragraph after first heading
    const firstParagraphMatch = content.match(/^#.+\n\n(.+?)(?:\n\n|$)/m);
    if (firstParagraphMatch) {
      return firstParagraphMatch[1].slice(0, 200);
    }

    // Fallback: get first 200 chars
    const cleanContent = content
      .replace(/^#+\s+/gm, "")
      .replace(/```[\s\S]*?```/g, "");
    return cleanContent.slice(0, 200).trim();
  }

  /**
   * Extract metadata from frontmatter (if available)
   */
  static mergeFrontmatter(
    extracted: ExtractedMetadata,
    frontmatter: any
  ): ExtractedMetadata {
    return {
      techStack:
        frontmatter.techStack || frontmatter.tech_stack || extracted.techStack,
      keywords: frontmatter.keywords || extracted.keywords,
      domain: frontmatter.domain || extracted.domain,
      languages: frontmatter.languages || extracted.languages,
      description: frontmatter.description || extracted.description,
    };
  }
}
