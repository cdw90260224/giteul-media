import Link from 'next/link';

const NEWS_ITEMS = [
  {
    id: 1,
    title: "湲濡쒕쾶 B2B SaaS 媛移??됯?, ARR 10諛?洹쒖튃? 源⑥죱?붽?",
    summary: "踰ㅼ쿂 罹먰뵾?덉쓽 ?됯? 湲곗? ?낅뜲?댄듃? ?ㅼ떆媛?Revenue Multiples 蹂?붾? ?듯빐 ?곸젙 湲곗뾽媛移섎? ?곗텧?섎뒗 ?덈줈??湲곗????쒖떆?⑸땲??",
    date: "04.01.2026",
    category: "?쒖옣 遺꾩꽍",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    title: "AI ?붾（???꾩엯瑜?1???곗뾽援곗?? 湲덉쑖 ?곗씠???꾧꺽 由щ럭",
    summary: "媛??蹂댁닔?곸씤 湲덉쑖沅뚯뿉???앹꽦??AI媛 ?꾩엯?섎뒗 ?띾룄? 洹쒕え瑜?遺꾩꽍?덉뒿?덈떎. B2B ?붾（??湲곗뾽?ㅼ씠 二쇰ぉ?댁빞 ??嫄곕? ?쒖옣?낅땲??",
    date: "03.31.2026",
    category: "由ъ꽌移?,
    image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    title: "?좊땲肄??꾩빟???꾪븳 Next Step: ?꾧툑?먮쫫 ?앹〈 留?,
    summary: "?쒕━利?C ?댁긽 ?ㅽ??몄뾽??怨듯넻?곸씤 ?꾧툑?먮쫫 ?꾧린 援ш컙怨??대? 諛⑹뼱??湲곗뾽?ㅼ쓽 ?꾨왂???뱀쭠??鍮꾧탳 遺꾩꽍?⑸땲??",
    date: "03.30.2026",
    category: "?щТ ?꾨왂",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 4,
    title: "援?궡 踰ㅼ쿂罹먰뵾??VC)???ы빐 ?섎컲湲??쒕씪?댄뙆?곕뜑 ?꾪솴",
    summary: "援?궡 ??15媛?VC?ㅼ씠 蹂댁쑀???쒕씪?댄뙆?곕뜑(?ъ옄 紐⑹쟻?쇰줈 紐④툑?섏뿀?쇰굹 ?꾩쭅 吏묓뻾?섏? ?딆? ?먭툑)??諛곕텇 ?꾨쭩???⑤룆 怨듦컻?⑸땲??",
    date: "03.29.2026",
    category: "VC ?곗씠??,
    image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 5,
    title: "?묒떆???쒕젅留? IPO vs M&A, ?곗씠?곕줈 蹂?理쒓렐 5??,
    summary: "?곸옣怨??몄닔?⑸퀝 以?李쎌뾽?먯뿉寃??뚯븘媛???ㅼ씡???곗씠???⑺듃濡?吏싳뼱遊낅땲?? 媛???꾩떎?곸씤 ?묒떆??紐⑤뜽? 臾댁뾿?쇨퉴??",
    date: "03.28.2026",
    category: "?묒떆??Exit)",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 6,
    title: "?깆옣?먯씠 ?ロ엳湲????뚯븘????湲濡쒕쾶 吏꾩텧 ?깃났 諛⑹젙??,
    summary: "援?궡瑜??섏뼱 誘멸뎅, ?쇰낯?쇰줈 吏꾩텧??B2B ?ㅽ??몄뾽?ㅼ쓽 珥덇린 濡쒖뺄?쇱씠?쒖씠??留덉???鍮꾩슜 援ъ“? 洹??⑥쑉???뚰뿤移⑸땲??",
    date: "03.27.2026",
    category: "湲濡쒕쾶 吏꾩텧",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 7,
    title: "?대씪?곕뱶 鍮꾩슜 ????1?? ?명봽??理쒖쟻??鍮꾧껐",
    summary: "留ㅻ뀈 湲고븯湲됱닔?곸쑝濡?利앷??섎뒗 ?대씪?곕뱶 鍮꾩슜???④낵?곸쑝濡?源롮븘??湲곗뾽?ㅼ쓽 ?꾪궎?띿쿂 怨듯넻?먭낵 ?앺깭怨꾨? 遺꾩꽍?덉뒿?덈떎.",
    date: "03.25.2026",
    category: "?댁쁺/?명봽??,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 8,
    title: "?ㅽ??몄뾽 ?몄옱???대룞: C?덈꺼??二쇰ぉ?섎뒗 蹂댁긽 ?ㅽ궎留?,
    summary: "?낃퀎 ?????덈꺼 ?듭떖 ?몄옱?ㅼ씠 ?댁쭅??怨좊젮????媛??源먭퉸?섍쾶 ?됯??섎뒗 ?ㅽ넚?듭뀡 ??蹂댁긽 ?⑦궎吏 ?몃젋?쒕? 怨듦컻?⑸땲??",
    date: "03.24.2026",
    category: "?몄옱/議곗쭅",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80"
  }
];

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center min-h-screen pb-20 font-sans">
      
      {/* Portal Top Navigation Bar */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/">
              <h1 className="text-3xl font-black text-deep-navy tracking-tight shadow-none">湲고?</h1>
            </Link>
            
            {/* Nav Menu */}
            <nav className="hidden md:flex items-center gap-6 mt-1">
              <span className="text-sm font-bold text-deep-navy border-b-2 border-deep-navy pb-1 cursor-pointer">??(?ㅻ뒛??吏??</span>
              <span className="text-sm font-semibold text-gray-600 hover:text-deep-navy cursor-pointer transition-colors">?ㅽ??몄뾽 M&A</span>
              <span className="text-sm font-semibold text-gray-600 hover:text-deep-navy cursor-pointer transition-colors">由ъ꽌移???/span>
              <span className="text-sm font-semibold text-gray-600 hover:text-deep-navy cursor-pointer transition-colors">湲고? ?ㅻ━吏??/span>
            </nav>
          </div>
          
          <div className="hidden lg:flex items-center">
            <div className="relative">
              <input 
                type="text" 
                placeholder="湲곗뾽紐낆씠???곗씠??寃??.." 
                className="w-64 bg-portal-bg border border-gray-200 text-sm rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-deep-navy/30 transition-all font-medium"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-[1400px] px-4 md:px-6 py-8">
        
        {/* Top Featured Headline (Hero Banner style) */}
        <section className="mb-10 w-full bg-deep-navy rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row items-center cursor-pointer group hover:shadow-xl transition-shadow duration-300">
           <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
             <span className="text-xs font-bold tracking-widest uppercase mb-3 text-white/70 bg-white/10 w-fit px-3 py-1 rounded-sm">
               ?뙚 ?ㅻ뱶?쇱씤 ?띾낫
             </span>
             <h2 className="text-3xl md:text-5xl font-black mb-5 leading-[1.15] text-white group-hover:text-blue-100 transition-colors">
               ?ㅼ??쇱뾽??媛濡쒕쭑??蹂묐ぉ ?꾩긽: ?곗씠?곕줈 蹂??뚰뙆援?             </h2>
             <p className="text-base md:text-lg text-white/80 line-clamp-2 leading-relaxed">
               ?쒕━利?B ?댁긽???ъ꽦??B2B ?ㅽ??몄뾽?ㅼ씠 怨듯넻?곸쑝濡?寃쏀뿕?섎뒗 留ㅼ텧 ?뺤껜???먯씤怨? ?대? 洹밸났???곗씠??湲곕컲??議곗쭅 媛쒗렪 ?щ??ㅼ쓣 4遺??由ы룷?몃줈 ?ㅻ９?덈떎.
             </p>
           </div>
           <div className="w-full md:w-1/2 md:h-full aspect-video md:aspect-auto bg-gray-800 relative overflow-hidden">
             <img 
               src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80" 
               alt="Top Headline Image" 
               className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" 
             />
           </div>
        </section>

        {/* MSN Portal Style Masonry/Grid Layout */}
        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">理쒖떊 ?낅뜲?댄듃</h2>
          <div className="flex-1 h-[1px] bg-gray-200 ml-4"></div>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {NEWS_ITEMS.map((item) => (
            <Link href={`/article/${item.id}`} key={item.id} className="group flex flex-col bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-deep-navy/30 transition-all duration-300 overflow-hidden">
              
              {/* Thumbnail Image */}
              <div className="w-full aspect-video bg-gray-100 overflow-hidden border-b border-gray-100 relative">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 block" 
                />
              </div>
              
              {/* Card Content Box */}
              <div className="p-5 flex flex-col flex-1">
                
                {/* Taxonomy Label */}
                <div className="flex items-center mb-3">
                  <span className="text-[11px] font-black text-deep-navy bg-blue-50/80 border border-blue-100/50 px-2.5 py-1 rounded-[4px] tracking-wide">
                    {item.category}
                  </span>
                </div>
                
                {/* Thick Bold Gothic Title */}
                <h3 className="text-xl md:text-[22px] font-black text-gray-900 mb-3 leading-snug group-hover:text-deep-navy transition-colors line-clamp-2">
                  {item.title}
                </h3>
                
                {/* Short 2-line Summary */}
                <p className="text-[15px] text-gray-600 line-clamp-2 mb-6 flex-1 leading-[1.6]">
                  {item.summary}
                </p>
                
                {/* Portal Footer (Logo & Date) */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    {/* Tiny Square Logo Accent */}
                    <span className="w-3.5 h-3.5 bg-deep-navy flex items-center justify-center rounded-sm">
                      <span className="text-[8px] font-black text-white shrink-0">G</span>
                    </span>
                    <span className="text-xs font-black text-deep-navy tracking-tight">湲고? 誘몃뵒??/span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 font-sans tracking-wide">
                    {item.date}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>

      </div>
    </main>
  );
}

