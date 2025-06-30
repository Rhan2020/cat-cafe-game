import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

// 语言类型定义
export enum Language {
    ZH_CN = 'zh-CN',
    EN_US = 'en-US',
    JA_JP = 'ja-JP',
    KO_KR = 'ko-KR'
}

// 翻译文本接口
interface TranslationData {
    [key: string]: string | TranslationData;
}

// 语言包数据
const translations: Record<Language, TranslationData> = {
    [Language.ZH_CN]: {
        common: {
            ok: '确定',
            cancel: '取消',
            loading: '加载中...',
            error: '错误',
            success: '成功',
            retry: '重试'
        },
        game: {
            title: '猫咪咖啡馆',
            gold: '金币',
            gems: '钻石',
            level: '等级',
            exp: '经验值'
        },
        animals: {
            cat: '猫咪',
            dog: '狗狗',
            hamster: '仓鼠',
            working: '工作中',
            idle: '空闲',
            tired: '疲劳'
        },
        errors: {
            network: '网络连接失败',
            login: '登录失败',
            unknown: '未知错误'
        }
    },
    [Language.EN_US]: {
        common: {
            ok: 'OK',
            cancel: 'Cancel',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            retry: 'Retry'
        },
        game: {
            title: 'Cat Cafe',
            gold: 'Gold',
            gems: 'Gems',
            level: 'Level',
            exp: 'Experience'
        },
        animals: {
            cat: 'Cat',
            dog: 'Dog',
            hamster: 'Hamster',
            working: 'Working',
            idle: 'Idle',
            tired: 'Tired'
        },
        errors: {
            network: 'Network connection failed',
            login: 'Login failed',
            unknown: 'Unknown error'
        }
    },
    [Language.JA_JP]: {
        common: {
            ok: 'OK',
            cancel: 'キャンセル',
            loading: '読み込み中...',
            error: 'エラー',
            success: '成功',
            retry: '再試行'
        },
        game: {
            title: '猫カフェ',
            gold: 'ゴールド',
            gems: 'ジェム',
            level: 'レベル',
            exp: '経験値'
        },
        animals: {
            cat: '猫',
            dog: '犬',
            hamster: 'ハムスター',
            working: '作業中',
            idle: 'アイドル',
            tired: '疲労'
        },
        errors: {
            network: 'ネットワーク接続に失敗しました',
            login: 'ログインに失敗しました',
            unknown: '不明なエラー'
        }
    },
    [Language.KO_KR]: {
        common: {
            ok: '확인',
            cancel: '취소',
            loading: '로딩 중...',
            error: '오류',
            success: '성공',
            retry: '다시 시도'
        },
        game: {
            title: '고양이 카페',
            gold: '골드',
            gems: '젬',
            level: '레벨',
            exp: '경험치'
        },
        animals: {
            cat: '고양이',
            dog: '강아지',
            hamster: '햄스터',
            working: '작업 중',
            idle: '유휴',
            tired: '피로'
        },
        errors: {
            network: '네트워크 연결 실패',
            login: '로그인 실패',
            unknown: '알 수 없는 오류'
        }
    }
};

@ccclass('I18nManager')
export class I18nManager extends Component {
    private static _instance: I18nManager = null;
    private _currentLanguage: Language = Language.ZH_CN;

    public static get Instance(): I18nManager {
        return this._instance;
    }

    onLoad() {
        if (I18nManager._instance) {
            this.destroy();
            return;
        }
        I18nManager._instance = this;
    }

    /**
     * 设置当前语言
     */
    public setLanguage(language: Language): void {
        this._currentLanguage = language;
        // 保存到本地存储
        localStorage.setItem('game_language', language);
        console.log(`语言设置为: ${language}`);
    }

    /**
     * 获取当前语言
     */
    public getCurrentLanguage(): Language {
        return this._currentLanguage;
    }

    /**
     * 初始化语言设置
     */
    public initLanguage(): void {
        // 从本地存储读取
        const savedLanguage = localStorage.getItem('game_language') as Language;
        if (savedLanguage && Object.values(Language).includes(savedLanguage)) {
            this._currentLanguage = savedLanguage;
            return;
        }

        // 自动检测系统语言
        const systemLanguage = this.detectSystemLanguage();
        this._currentLanguage = systemLanguage;
    }

    /**
     * 检测系统语言
     */
    private detectSystemLanguage(): Language {
        // 在微信小游戏环境中
        if (typeof wx !== 'undefined' && wx.getSystemInfo) {
            return new Promise<Language>((resolve) => {
                wx.getSystemInfo({
                    success: (res: any) => {
                        const locale = res.language || 'zh-CN';
                        const language = this.mapLocaleToLanguage(locale);
                        resolve(language);
                    },
                    fail: () => {
                        resolve(Language.ZH_CN);
                    }
                });
            }) as any;
        }
        
        // 在Web环境中
        const locale = navigator.language || 'zh-CN';
        return this.mapLocaleToLanguage(locale);
    }

    /**
     * 映射系统语言到游戏语言
     */
    private mapLocaleToLanguage(locale: string): Language {
        if (locale.startsWith('en')) return Language.EN_US;
        if (locale.startsWith('ja')) return Language.JA_JP;
        if (locale.startsWith('ko')) return Language.KO_KR;
        return Language.ZH_CN; // 默认中文
    }

    /**
     * 获取翻译文本
     */
    public t(key: string): string {
        const keys = key.split('.');
        let current: any = translations[this._currentLanguage];
        
        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                // 如果当前语言没有找到，尝试使用中文作为备选
                let fallback: any = translations[Language.ZH_CN];
                for (const fallbackKey of keys) {
                    if (fallback && typeof fallback === 'object' && fallbackKey in fallback) {
                        fallback = fallback[fallbackKey];
                    } else {
                        return `[${key}]`; // 如果都没找到，返回key本身
                    }
                }
                return fallback;
            }
        }
        
        return typeof current === 'string' ? current : `[${key}]`;
    }

    /**
     * 获取支持的语言列表
     */
    public getSupportedLanguages(): Array<{code: Language, name: string}> {
        return [
            { code: Language.ZH_CN, name: '简体中文' },
            { code: Language.EN_US, name: 'English' },
            { code: Language.JA_JP, name: '日本語' },
            { code: Language.KO_KR, name: '한국어' }
        ];
    }
}