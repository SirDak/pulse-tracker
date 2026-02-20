'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useData } from '@/context/DataContext';
import { IoSearch, IoAdd, IoClose, IoStar, IoStarOutline } from 'react-icons/io5';
import styles from './food.module.css';

interface FoodResult {
    product_name: string;
    brands: string;
    serving_size: string;
    nutriments: {
        'energy-kcal_100g': number;
        proteins_100g: number;
        carbohydrates_100g: number;
        fat_100g: number;
    };
    image_small_url?: string;
}

export default function FoodSearchPage() {
    const { addMeal, settings } = useData();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FoodResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);
    const [servings, setServings] = useState('1');
    const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
    const [mounted, setMounted] = useState(false);
    const [favorites, setFavorites] = useState<FoodResult[]>([]);
    const [showFavorites, setShowFavorites] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => { setMounted(true); }, []);

    const searchFood = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(
                `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,brands,serving_size,nutriments,image_small_url`
            );
            const data = await res.json();
            const filtered = (data.products || []).filter(
                (p: FoodResult) => p.product_name && p.nutriments?.['energy-kcal_100g']
            );
            setResults(filtered);
            if (filtered.length === 0) setError('No results found. Try different keywords.');
        } catch {
            setError('Search failed. Check your connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (value: string) => {
        setQuery(value);
        setShowFavorites(false);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => searchFood(value), 400);
    };

    const selectFood = (food: FoodResult) => {
        setSelectedFood(food);
        setServings('1');
    };

    const toggleFavorite = (food: FoodResult) => {
        setFavorites(prev => {
            const exists = prev.some(f => f.product_name === food.product_name && f.brands === food.brands);
            if (exists) return prev.filter(f => !(f.product_name === food.product_name && f.brands === food.brands));
            return [...prev, food];
        });
    };

    const isFavorite = (food: FoodResult) =>
        favorites.some(f => f.product_name === food.product_name && f.brands === food.brands);

    const getScaledNutrient = (food: FoodResult, key: keyof FoodResult['nutriments']) => {
        const per100 = food.nutriments[key] || 0;
        const servingG = parseServingSize(food.serving_size);
        return Math.round(per100 * (servingG / 100) * Number(servings || 1));
    };

    const parseServingSize = (size: string): number => {
        if (!size) return 100;
        const match = size.match(/(\d+\.?\d*)\s*g/i);
        return match ? parseFloat(match[1]) : 100;
    };

    const handleAddMeal = async () => {
        if (!selectedFood) return;
        const cal = getScaledNutrient(selectedFood, 'energy-kcal_100g');
        const pro = getScaledNutrient(selectedFood, 'proteins_100g');
        const carb = getScaledNutrient(selectedFood, 'carbohydrates_100g');
        const fat = getScaledNutrient(selectedFood, 'fat_100g');

        await addMeal({
            date: new Date().toISOString().split('T')[0],
            meal_type: mealType,
            food_name: `${selectedFood.product_name}${selectedFood.brands ? ` (${selectedFood.brands})` : ''}`,
            serving_size: `${servings}× ${selectedFood.serving_size || '100g'}`,
            calories: cal,
            protein_g: pro,
            carbs_g: carb,
            fat_g: fat,
        });
        setSelectedFood(null);
        setQuery('');
        setResults([]);
    };

    if (!mounted) return null;

    const isSimple = settings.nutrition_mode === 'simple';

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Food Search</h1>
                <p className={styles.subtitle}>Powered by OpenFoodFacts</p>
            </header>

            {/* Search bar */}
            <div className={styles.searchBar}>
                <IoSearch className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search foods (e.g. chicken breast, oatmeal...)"
                    value={query}
                    onChange={e => handleInputChange(e.target.value)}
                    className={styles.searchInput}
                />
                {query && (
                    <button className={styles.clearBtn} onClick={() => { setQuery(''); setResults([]); }}>
                        <IoClose />
                    </button>
                )}
            </div>

            {/* Favorites toggle */}
            {favorites.length > 0 && (
                <button
                    className={`${styles.favToggle} ${showFavorites ? styles.active : ''}`}
                    onClick={() => setShowFavorites(!showFavorites)}
                >
                    <IoStar /> Favorites ({favorites.length})
                </button>
            )}

            {/* Loading */}
            {loading && <div className={styles.status}>Searching...</div>}
            {error && <div className={styles.status}>{error}</div>}

            {/* Results */}
            <div className={styles.results}>
                {(showFavorites ? favorites : results).map((food, i) => (
                    <div key={i} className={styles.foodCard} onClick={() => selectFood(food)}>
                        <div className={styles.foodInfo}>
                            <div className={styles.foodName}>{food.product_name}</div>
                            {food.brands && <div className={styles.foodBrand}>{food.brands}</div>}
                            <div className={styles.foodMacros}>
                                <span className={styles.cal}>
                                    {Math.round(food.nutriments['energy-kcal_100g'])} cal
                                </span>
                                {!isSimple && (
                                    <>
                                        <span className={styles.macroP}>
                                            P {Math.round(food.nutriments.proteins_100g)}g
                                        </span>
                                        <span className={styles.macroC}>
                                            C {Math.round(food.nutriments.carbohydrates_100g)}g
                                        </span>
                                        <span className={styles.macroF}>
                                            F {Math.round(food.nutriments.fat_100g)}g
                                        </span>
                                    </>
                                )}
                                <span className={styles.perServing}>/ 100g</span>
                            </div>
                        </div>
                        <button
                            className={styles.favBtn}
                            onClick={e => { e.stopPropagation(); toggleFavorite(food); }}
                        >
                            {isFavorite(food) ? <IoStar color="#FFD700" /> : <IoStarOutline />}
                        </button>
                    </div>
                ))}
            </div>

            {/* Empty state */}
            {!loading && !error && results.length === 0 && !showFavorites && !query && (
                <div className={styles.emptyState}>
                    <IoSearch className={styles.emptyIcon} />
                    <p>Search for any food to see nutrition info</p>
                    <p className={styles.emptyHint}>Try "chicken breast", "oats", or "banana"</p>
                </div>
            )}

            {/* Detail Modal */}
            {selectedFood && (
                <div className={styles.modalOverlay} onClick={() => setSelectedFood(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setSelectedFood(null)}>
                            <IoClose />
                        </button>

                        <h2 className={styles.modalTitle}>{selectedFood.product_name}</h2>
                        {selectedFood.brands && (
                            <p className={styles.modalBrand}>{selectedFood.brands}</p>
                        )}

                        <div className={styles.servingRow}>
                            <div className={styles.formGroup}>
                                <label>Servings</label>
                                <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={servings}
                                    onChange={e => setServings(e.target.value)}
                                    className={styles.servingInput}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Meal</label>
                                <select
                                    value={mealType}
                                    onChange={e => setMealType(e.target.value as typeof mealType)}
                                    className={styles.mealSelect}
                                >
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snack">Snack</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.nutrientGrid}>
                            <div className={`${styles.nutrientCard} ${styles.calCard}`}>
                                <span className={styles.nutrientValue}>
                                    {getScaledNutrient(selectedFood, 'energy-kcal_100g')}
                                </span>
                                <span className={styles.nutrientLabel}>Calories</span>
                            </div>
                            {!isSimple && (
                                <>
                                    <div className={`${styles.nutrientCard} ${styles.proteinCard}`}>
                                        <span className={styles.nutrientValue}>
                                            {getScaledNutrient(selectedFood, 'proteins_100g')}g
                                        </span>
                                        <span className={styles.nutrientLabel}>Protein</span>
                                    </div>
                                    <div className={`${styles.nutrientCard} ${styles.carbCard}`}>
                                        <span className={styles.nutrientValue}>
                                            {getScaledNutrient(selectedFood, 'carbohydrates_100g')}g
                                        </span>
                                        <span className={styles.nutrientLabel}>Carbs</span>
                                    </div>
                                    <div className={`${styles.nutrientCard} ${styles.fatCard}`}>
                                        <span className={styles.nutrientValue}>
                                            {getScaledNutrient(selectedFood, 'fat_100g')}g
                                        </span>
                                        <span className={styles.nutrientLabel}>Fat</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={styles.servingNote}>
                            Per serving: {selectedFood.serving_size || '100g'}
                        </div>

                        <button className={styles.addBtn} onClick={handleAddMeal}>
                            <IoAdd /> Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
