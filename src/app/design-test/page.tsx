import FloatingHeader from '@/components/ui/FloatingHeader';

export default function DesignTestPage() {
    return (
        <div className="min-h-[200vh] bg-slate-50 dark:bg-slate-950 font-cairo">
            {/* 
        NOTE: We are NOT using the global layout's navbar here ideally, 
        but since layout.tsx wraps everything, the current navbar will still appear underneath or above.
        For a true isolated test, we normally use a different layout, 
        but here we will just place the floating header on top.
      */}

            <FloatingHeader />

            {/* Hero Section */}
            <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden">
                {/* Colorful Background */}
                <div className="absolute inset-0 bg-base-gradient opacity-10 dark:opacity-20" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-transparent to-transparent dark:from-emerald-900/30" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-200/30 dark:bg-sky-900/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl" />

                <div className="relative text-center space-y-6 max-w-2xl px-4 z-10 mt-20">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm font-bold border border-emerald-200 dark:border-emerald-800">
                        تجربة تصميم جديد ✨
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-800 dark:text-white leading-tight">
                        الملاحة <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-sky-600">العائمة</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                        هذا نموذج أولي لشريط التنقل بأسلوب "الكبسولة الزجاجية". جرب التمرير لأسفل لترى كيف يثبت في مكانه بشكل أنيق ومنفصل عن المحتوى.
                    </p>
                </div>
            </section>

            {/* Content to test Scroll */}
            <section className="max-w-4xl mx-auto px-4 py-20 space-y-12">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">تجربة المحتوى {i}</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-loose">
                            لوريم إيبسوم دولار سيت أميت، كونسيكتيتور أديبيسينغ إليت. سيد دو أيوسمود تيمبور إنكيديدونت أوت لابوري إت دولوري ماغنا أليكا. أوت إنيم أد مينيم فينيام، كيس نوسترود إكسيرسيتاسيون أولامكو لابوريس نيسي أوت أليكويب إكس إيا كومودو كونسي كوات.
                            <br /><br />
                            دويس أوتي إيروري دولور إن ريبريهينديريت إن فولوبتاتي فيليت إيسي كايلوم دولوري إيو فوغيات نولا بارياتور. إكسيبتيور سينت أوكايكات كوبيداتات نون بروايدينت، سون أين كولبا كي أوفيسيا ديسيرونت موليت أنيم إيد إست لابوروم.
                        </p>
                    </div>
                ))}
            </section>
        </div>
    );
}
