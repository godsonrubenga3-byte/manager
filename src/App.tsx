import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, PieChart, LayoutDashboard, Settings, LogOut, Menu, X, Search, Filter, TrendingUp, Target, Trash2, User, Lock, Mail } from 'lucide-react';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Spending3D from './components/Spending3D';
import InvestmentCards from './components/InvestmentCards';
import AIInsights from './components/AIInsights';
import BudgetManager from './components/BudgetManager';
import SavingsGoals from './components/SavingsGoals';
import { getAIInsights, Transaction } from './services/geminiService';

interface UserData {
  id: number;
  email: string;
  name: string;
}

export default function App() {
  return null;
}
