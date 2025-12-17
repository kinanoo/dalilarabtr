'use client';
import { Metadata } from 'next';
import ToolSchema from '@/components/ToolSchema';
import Navbar from '@/components/Navbar';
import { useState } from 'react';

export default function CalculatorPage() {
  const [age, setAge] = useState(25);
  const [type, setType] = useState('first'); // first or renew

  // معادلة تقريبية (وهمية للتمثيل)
  const tax = type === 'first' ? 3500 : 1500;
  const insurance = age * 50; // كل سنة ب 50 ليرة
  const cardFee = 565;
  const total = tax + insurance + cardFee;

  return (
    <div className="min-h-screen">
      <Navbar />
      <ToolSchema tool="ban-calculator" />
      <div className="max-w-xl mx-auto mt-20 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-transparent dark:border-slate-800">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-900 dark:text-slate-100">حاسبة تكاليف الإقامة التقريبية</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block font-bold mb-2 text-slate-900 dark:text-slate-100">نوع المعاملة</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            >
              <option value="first">أول مرة (جديدة)</option>
              <option value="renew">تجديد</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-2 text-slate-900 dark:text-slate-100">العمر: {age} سنة</label>
            <input 
              type="range" min="18" max="65" value={age} 
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-accent-500"
            />
          </div>

          <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-xl mt-6 text-center border border-transparent dark:border-primary-900/30">
            <p className="text-slate-500 dark:text-slate-300 mb-2">التكلفة التقديرية</p>
            <span className="text-4xl font-bold text-primary-600">{total} TL</span>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">* تشمل الضريبة، التأمين، ورسوم الكرت</p>
          </div>
        </div>
      </div>
    </div>
  );
}