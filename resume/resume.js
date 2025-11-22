// Resume scrollytelling for Selected Experience
const experiences = [
  {
    company: "UC SAN DIEGO",
    role: "UNDERGRADUATE RESEARCHER",
    period: "2023-2025",
    summaryKo: "SKLearn 머신러닝 알고리즘의 내부 수학적 동작을 시각화하는 교육용 웹 플랫폼을 개발했습니다. XGBoost와 NLP를 활용해 소셜 미디어 및 금융 데이터를 통합, 단기 스왑 트레이딩을 위한 퀀트 봇을 설계했습니다. Python과 R을 통해 복잡한 통계 실험과 예측 모델을 코드로 구현하며, 계량적 사고를 시스템화하는 역량을 강화했습니다.",
    summaryEn: "Developed an educational web platform to interactively visualize the internal mathematics of SKLearn's ML algorithms. Designed a quant trading bot for short-term swaps, integrating social media and financial data using XGBoost and NLP. Systematized quantitative thinking by implementing complex statistical experiments and predictive models as code using Python and R."
  },
  {
    company: "8PERCENT",
    role: "DATA SCIENTIST, STRATEGY & OPERATIONS\nSENIOR MANAGER, CORPORATE DEVELOPMENT",
    period: "2022-2023",
    summaryKo: "ML 기반 대안 데이터를 활용한 신용평가모델(CSS) 개발을 주도하고, AI를 도입해 전사 운영 효율화를 이끌었습니다. 저축은행 인수합병(M&A) 실사, GTM 재무 모델링, C-Level 및 투자자 커뮤니케이션 등 핵심 전략 기획을 리드했습니다. 70명 규모 조직(대출, 마케팅, 재무, 운영)의 KPI, 예산 계획, 성과 모니터링을 총괄했습니다.",
    summaryEn: "Led the development of an ML-based credit scoring model (CSS) using alternative data and drove enterprise-wide operational efficiency through AI implementation. Directed key strategic initiatives including savings bank M&A diligence, GTM financial modeling, and C-level/investor communications. Oversaw KPIs, budget planning, and performance monitoring for a 70-person organization across Loan, Marketing, Finance, and Ops."
  },
  {
    company: "HISSTORY VENTURE INVESTMENTS",
    role: "SENIOR ASSOCIATE",
    period: "2021",
    summaryKo: "핀테크 및 소프트웨어 분야 시리즈 A-B 딜의 전 과정을 리드, 100개 이상의 스타트업 소싱부터 실사, 2개의 IPO 성공 사례를 포함한 $80M 규모의 공동 투자를 집행했습니다.",
    summaryEn: "Led the end-to-end investment process for Series A-B fintech/software startups, from sourcing 100+ companies to leading diligence and closing $80M in co-investments, including two successful IPOs."
  },
  {
    company: "PFC TECHNOLOGIES",
    role: "QUANT ANALYST, STRUCTURED FINANCE\nMANAGER, INSTITUTIONAL INVESTMENT",
    period: "2019-2021",
    summaryKo: "퀀트 애널리스트로서 신용 리스크 평가를 위한 재무 모델링 프레임워크를 구축했습니다. 디지털 대출 플랫폼 기반 합성 은행 대출의 자동 리볼빙 및 관리 시스템을 설계하고, 사모 펀드 등 기관 투자자를 위한 맞춤형 증권화 상품을 제공했습니다. 계량적 방법론을 사용해 개인 투자자용 포트폴리오 상품을 설계하고, 대출 데이터 분석 및 BI 솔루션 개발을 주도했습니다.",
    summaryEn: "As a Quant Analyst, built financial modeling frameworks for credit risk assessment. Designed an automated revolving management system for synthetic bank loans on a digital lending platform, delivering customized securitized products to institutional investors, including private debt funds. Designed a diversified bank-loan portfolio product for retail investors using quantitative methods and enhanced data-driven decision-making by developing loan data analytics and BI solutions."
  }
];

let isKorean = false;

function renderExperiences() {
  const container = d3.select('#experience-list');
  container.selectAll('.experience-item')
    .data(experiences)
    .join('div')
    .attr('class', 'experience-item')
    .html((d, i) => {
      return `
        <div class="experience-entry">
          <div class="experience-header">
            <h3 class="experience-company">${d.company}</h3>
            <span class="experience-period">${d.period}</span>
          </div>
          <p class="experience-role">${d.role}</p>
          <p class="experience-summary">${isKorean ? d.summaryKo : d.summaryEn}</p>
        </div>
      `;
    });
}

// Language toggle
function setupLanguageToggle() {
  const toggleButtons = document.querySelectorAll('.lang-toggle');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      toggleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update language
      isKorean = btn.dataset.lang === 'ko';
      renderExperiences();
    });
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  renderExperiences();
  setupLanguageToggle();
});

