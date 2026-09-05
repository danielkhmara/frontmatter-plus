import type { PluginLocale } from "./settings";

type Dict = Record<string, string>;

const en: Dict = {
  language: "Interface language",
  languageDesc: "Sets the language used in the plugin settings.",
  langEn: "English",
  langDe: "German",
  langZh: "Chinese",
  langFr: "French",
  langRu: "Russian",
  coreTitle: "File properties",
  createdKey: "Created date key",
  createdKeyDesc: "YAML field name used to store the file creation date and time.",
  updatedKey: "Updated date key",
  updatedKeyDesc: "YAML field name used to store the file update date and time.",
  dateFormat: "Date and time format",
  dateFormatDesc: "Date and time formatting uses the Moment.js JavaScript library.",
  createDelay: "Delay after file creation",
  createDelayDesc:
    "Time in milliseconds (1000 ms = 1 second) before the creation date and time are written to the selected YAML field.",
  updateDelay: "Delay after file update",
  updateDelayDesc:
    "Time in milliseconds (1000 ms = 1 second) before the update date and time are written to the selected YAML field.",
  msHint: "Use milliseconds only (1000 ms = 1 second).",
  triggersTitle: "Behavior rules",
  autoInsertCreated: "Add created to new files",
  autoInsertUpdated: "Add updated to new files",
  autoInsertCreatedDesc:
    "When a new file has no properties, the plugin creates a YAML field with the creation date and time and fills it in.",
  autoInsertUpdatedDesc:
    "When a new file has no properties, the plugin creates a YAML field with the update date and time and fills it in.",
  forceInsertCreated: "Force-add created",
  forceInsertUpdated: "Force-add updated",
  forceInsertCreatedDesc:
    "If a file already has properties but is missing the created YAML field, the plugin adds it and fills in the creation date and time.",
  forceInsertUpdatedDesc:
    "If a file already has properties but is missing the updated YAML field, the plugin adds it and fills in the update date and time.",
  fillEmptyKeys: "Fill created and updated",
  fillEmptyKeysDesc:
    "If created or updated already exist in the file properties but are empty, the plugin fills them with the current date and time after the delay set above.",
  exclusionsTitle: "Exclusions",
  excludedFolders: "Excluded folders",
  excludedFoldersDesc: "Choose folders whose files the plugin will leave untouched.",
  excludedFiles: "Excluded files",
  excludedFilesDesc: "Choose files the plugin will leave untouched.",
  exclusionsNote:
    "Selected folders do not apply to the Enhanced folder templates section.",
  folderPlaceholder: "Search folder path…",
  filePlaceholder: "Search file path…",
  remove: "Remove",
  dragToReorder: "Drag to reorder",
  badgeTitle: "File summary",
  showBadge: "Show file summary",
  showBadgeDesc:
    "Shows a metrics line at the top of the file properties. Key note details stay in one row without opening Obsidian side panels.",
  staleWarning: "Stale file label",
  staleWarningDesc:
    "Shows a Stale label when you have not edited the file for a long time. Highlights neglected notes that may need a review or update.",
  staleDays: "Stale after",
  staleDaysDesc:
    "Number of days without edits after which a file is treated as stale.",
  yamlPct: "YAML completeness (%)",
  yamlPctDesc:
    "Checks all property fields in the open file and shows what share of keys already have values.",
  fileSize: "File size on disk",
  fileSizeDesc:
    "Shows the open file’s size on disk. Updates as you type and includes the whole document, properties included—not just the note body.",
  readingTime: "Reading time",
  readingTimeDesc:
    "Estimates how long it takes to read the file from start to finish based on word count. Shows the result in minutes above Properties.",
  wpm: "Reading speed",
  wpmDesc:
    "Set a personal reading speed for a more accurate estimate. Typical adult reading speed is about 180–240 words per minute.",
  focusTimer: "Editing time",
  focusTimerDesc:
    "Tracks active time in the open tab. Pauses when you switch to another Obsidian tab and resets when the file is closed. Shows the current session length, not system mtime.",
  tasksIndicator: "Completed tasks",
  tasksIndicatorDesc:
    "Finds all checkboxes in the note and shows completed tasks versus the total. Hidden when there are no checkboxes.",
  isolatedIndicator: "Isolated file label",
  isolatedIndicatorDesc:
    "Shows an Isolated label when the file has no incoming or outgoing links to other files. Uses only existing files via the resolvedLinks index. Appears when no connections are found.",
  isolatedNote:
    "Links to nonexistent ghost files that have not been created in your vault yet are ignored by the search index and do not count as connections.",
  templatesTitle: "Enhanced folder templates",
  templatesDesc:
    "Automatically applies a chosen template when new files are created in the selected folder.",
  addRule: "Add template",
  statusBarTitle: "Status bar",
  statusBarShow: "Date and time",
  statusBarShowDesc: "Shows the current date and time in the status bar.",
  statusBarDateFormat: "Date format",
  statusBarTimeFormat: "Time format",
  statusBarMomentDesc:
    "Date and time formatting uses the Moment.js JavaScript library.",
  statusBarFormatPreview: "Preview: {preview}.",
  noticeLabel: "Note:",
  desktopOnlyBody: "Desktop only.",
  fillEmptyName: "Fill empty dates",
  fillEmptyDesc: "Fills empty created and updated fields using the file's date from the filesystem. Excluded files and folders are not affected.",
  fillEmptyButton: "Fill",
  fillEmptyResult: "Files updated: {count}",
  backupTitle: "Backup",
  backupName: "Export and import settings",
  backupDesc: "Saves all plugin settings to a file. Import the same file to apply the settings in another vault.",
  exportButton: "Export",
  importButton: "Import",
  exportResult: "Settings exported to frontmatter-plus-settings.json in the vault root.",
  importResult: "Settings imported.",
  importMissing: "No frontmatter-plus-settings.json file found in the vault root.",
  templateConflict: "Another rule already applies a different template to this folder.",
  resetTitle: "Danger zone",
  resetName: "Reset settings",
  resetDesc: "Restores all plugin settings to their defaults.",
  resetButton: "Reset",
  indicatorMinRead: "{n} min read",
  indicatorYaml: "YAML {n}%",
  indicatorStale: "Stale {n}d",
  indicatorTasks: "{done} of {total} tasks",
  indicatorIsolated: "Isolated",
  indicatorYamlError: "YAML error",
  sizeB: "{n} B",
  sizeKB: "{n} KB",
  sizeMB: "{n} MB",
  sizeGB: "{n} GB",
};

const de: Dict = {
  language: "Oberflächensprache",
  languageDesc: "Sprache der Plugin-Einstellungen.",
  langEn: "Englisch",
  langDe: "Deutsch",
  langZh: "Chinesisch",
  langFr: "Französisch",
  langRu: "Russisch",
  coreTitle: "Dateieigenschaften",
  createdKey: "Schlüssel für Erstellungsdatum",
  createdKeyDesc:
    "Name des YAML-Felds für Datum und Uhrzeit der Dateierstellung.",
  updatedKey: "Schlüssel für Aktualisierungsdatum",
  updatedKeyDesc:
    "Name des YAML-Felds für Datum und Uhrzeit der Dateiaktualisierung.",
  dateFormat: "Datums- und Zeitformat",
  dateFormatDesc:
    "Für Datum und Uhrzeit wird die JavaScript-Bibliothek Moment.js verwendet.",
  createDelay: "Verzögerung nach dem Erstellen",
  createDelayDesc:
    "Zeit in Millisekunden (1000 ms = 1 Sekunde), nach der Erstellungsdatum und -uhrzeit ins gewählte YAML-Feld geschrieben werden.",
  updateDelay: "Verzögerung nach dem Aktualisieren",
  updateDelayDesc:
    "Zeit in Millisekunden (1000 ms = 1 Sekunde), nach der Aktualisierungsdatum und -uhrzeit ins gewählte YAML-Feld geschrieben werden.",
  msHint: "Nur in Millisekunden angeben (1000 ms = 1 Sekunde).",
  triggersTitle: "Verhaltensregeln",
  autoInsertCreated: "created in neuen Dateien hinzufügen",
  autoInsertUpdated: "updated in neuen Dateien hinzufügen",
  autoInsertCreatedDesc:
    "Hat eine neue Datei noch keine Eigenschaften, legt das Plugin ein YAML-Feld mit Erstellungsdatum und -uhrzeit an und füllt es aus.",
  autoInsertUpdatedDesc:
    "Hat eine neue Datei noch keine Eigenschaften, legt das Plugin ein YAML-Feld mit Aktualisierungsdatum und -uhrzeit an und füllt es aus.",
  forceInsertCreated: "created erzwingen",
  forceInsertUpdated: "updated erzwingen",
  forceInsertCreatedDesc:
    "Hat die Datei bereits Eigenschaften, fehlt aber das YAML-Feld created, wird es angelegt und mit Erstellungsdatum und -uhrzeit gefüllt.",
  forceInsertUpdatedDesc:
    "Hat die Datei bereits Eigenschaften, fehlt aber das YAML-Feld updated, wird es angelegt und mit Aktualisierungsdatum und -uhrzeit gefüllt.",
  fillEmptyKeys: "created und updated ausfüllen",
  fillEmptyKeysDesc:
    "Existieren created oder updated in den Eigenschaften, sind aber leer, trägt das Plugin nach der oben festgelegten Verzögerung Datum und Uhrzeit ein.",
  exclusionsTitle: "Ausschlüsse",
  excludedFolders: "Ausgeschlossene Ordner",
  excludedFoldersDesc:
    "Ordner wählen, deren Dateien das Plugin vollständig ignoriert.",
  excludedFiles: "Ausgeschlossene Dateien",
  excludedFilesDesc: "Dateien wählen, die das Plugin vollständig ignoriert.",
  exclusionsNote:
    "Ausgewählte Ordner gelten nicht für den Bereich „Erweiterte Ordner-Vorlagen“.",
  folderPlaceholder: "Ordnerpfad suchen…",
  filePlaceholder: "Dateipfad suchen…",
  remove: "Entfernen",
  dragToReorder: "Zum Neuanordnen ziehen",
  badgeTitle: "Dateizusammenfassung",
  showBadge: "Dateizusammenfassung anzeigen",
  showBadgeDesc:
    "Zeigt eine Kennzahlenzeile oben bei den Dateieigenschaften. Wichtige Notizdaten bleiben in einer Zeile, ohne Seitenbereiche in Obsidian zu öffnen.",
  staleWarning: "Kennzeichnung veralteter Dateien",
  staleWarningDesc:
    "Zeigt „Veraltet“, wenn Sie die Datei lange nicht bearbeitet haben. Weist auf vernachlässigte Notizen hin, die geprüft oder aktualisiert werden sollten.",
  staleDays: "Veraltet nach",
  staleDaysDesc:
    "Anzahl der Tage ohne Bearbeitung, nach denen eine Datei als veraltet gilt.",
  yamlPct: "YAML-Vollständigkeit (%)",
  yamlPctDesc:
    "Prüft alle Eigenschaftsfelder der geöffneten Datei und zeigt den Anteil der Schlüssel mit Werten.",
  fileSize: "Dateigröße auf der Festplatte",
  fileSizeDesc:
    "Zeigt die Größe der geöffneten Datei auf der Festplatte. Aktualisiert sich beim Tippen und umfasst das gesamte Dokument inklusive Eigenschaften – nicht nur den Notiztext.",
  readingTime: "Lesezeit",
  readingTimeDesc:
    "Schätzt die Lesezeit von Anfang bis Ende anhand der Wortanzahl. Zeigt das Ergebnis in Minuten über den Eigenschaften.",
  wpm: "Lesegeschwindigkeit",
  wpmDesc:
    "Individuelle Lesegeschwindigkeit für eine genauere Schätzung. Üblich bei Erwachsenen sind etwa 180–240 Wörter pro Minute.",
  focusTimer: "Bearbeitungszeit",
  focusTimerDesc:
    "Misst die aktive Zeit im geöffneten Tab. Pausiert beim Wechsel zu einem anderen Obsidian-Tab und setzt sich beim Schließen der Datei zurück. Zeigt die aktuelle Sitzung, nicht die Systemzeit mtime.",
  tasksIndicator: "Erledigte Aufgaben",
  tasksIndicatorDesc:
    "Findet alle Kontrollkästchen in der Notiz und zeigt erledigte Aufgaben im Verhältnis zur Gesamtzahl. Wird ausgeblendet, wenn keine Kontrollkästchen vorhanden sind.",
  isolatedIndicator: "Kennzeichnung isolierter Dateien",
  isolatedIndicatorDesc:
    "Zeigt „Isoliert“, wenn die Datei keine eingehenden oder ausgehenden Links zu anderen Dateien hat. Prüft nur vorhandene Dateien über den Index resolvedLinks. Erscheint, wenn keine Verbindung gefunden wird.",
  isolatedNote:
    "Links zu nicht vorhandenen Phantomdateien, die in Ihrem Tresor noch nicht angelegt wurden, werden vom Suchindex ignoriert und zählen nicht als Verbindungen.",
  templatesTitle: "Erweiterte Ordner-Vorlagen",
  templatesDesc:
    "Wendet beim Erstellen neuer Dateien im gewählten Ordner automatisch die festgelegte Vorlage an.",
  addRule: "Vorlage hinzufügen",
  statusBarTitle: "Statusleiste",
  statusBarShow: "Datum und Uhrzeit",
  statusBarShowDesc: "Zeigt aktuelles Datum und Uhrzeit in der Statusleiste.",
  statusBarDateFormat: "Datumsformat",
  statusBarTimeFormat: "Zeitformat",
  statusBarMomentDesc:
    "Für Datum und Uhrzeit wird die JavaScript-Bibliothek Moment.js verwendet.",
  statusBarFormatPreview: "Vorschau: {preview}.",
  noticeLabel: "Hinweis:",
  desktopOnlyBody: "Nur in der Desktop-Version verfügbar.",
  fillEmptyName: "Leere Daten füllen",
  fillEmptyDesc: "Füllt leere created- und updated-Felder mit dem Dateidatum aus dem Dateisystem. Dateien und Ordner aus den Ausschlüssen bleiben unberührt.",
  fillEmptyButton: "Füllen",
  fillEmptyResult: "Aktualisierte Dateien: {count}",
  backupTitle: "Sicherung",
  backupName: "Einstellungen exportieren und importieren",
  backupDesc: "Speichert alle Plugin-Einstellungen in einer Datei. Dieselbe Datei lässt sich importieren, um die Einstellungen in einem anderen Vault zu übernehmen.",
  exportButton: "Exportieren",
  importButton: "Importieren",
  exportResult: "Einstellungen wurden nach frontmatter-plus-settings.json im Vault-Stammordner exportiert.",
  importResult: "Einstellungen wurden importiert.",
  importMissing: "Keine Datei frontmatter-plus-settings.json im Vault-Stammordner gefunden.",
  templateConflict: "Für diesen Ordner gilt bereits eine andere Vorlage durch eine weitere Regel.",
  resetTitle: "Gefahrenzone",
  resetName: "Einstellungen zurücksetzen",
  resetDesc: "Setzt alle Plugin-Einstellungen auf die Standardwerte zurück.",
  resetButton: "Zurücksetzen",
  indicatorMinRead: "{n} Min. Lesezeit",
  indicatorYaml: "YAML {n}%",
  indicatorStale: "Veraltet {n} T.",
  indicatorTasks: "{done} von {total} Aufgaben",
  indicatorIsolated: "Isoliert",
  indicatorYamlError: "YAML-Fehler",
  sizeB: "{n} B",
  sizeKB: "{n} KB",
  sizeMB: "{n} MB",
  sizeGB: "{n} GB",
};

const zh: Dict = {
  language: "界面语言",
  languageDesc: "设置插件设置界面的显示语言。",
  langEn: "英语",
  langDe: "德语",
  langZh: "中文",
  langFr: "法语",
  langRu: "俄语",
  coreTitle: "文件属性",
  createdKey: "创建日期键名",
  createdKeyDesc: "用于写入文件创建日期和时间的 YAML 字段名。",
  updatedKey: "更新日期键名",
  updatedKeyDesc: "用于写入文件更新日期和时间的 YAML 字段名。",
  dateFormat: "日期和时间格式",
  dateFormatDesc: "日期和时间格式化使用 JavaScript 库 Moment.js。",
  createDelay: "创建文件后的延迟",
  createDelayDesc:
    "以毫秒为单位的时间（1000 毫秒 = 1 秒），经过该时间后将创建日期和时间写入所选 YAML 字段。",
  updateDelay: "更新文件后的延迟",
  updateDelayDesc:
    "以毫秒为单位的时间（1000 毫秒 = 1 秒），经过该时间后将更新日期和时间写入所选 YAML 字段。",
  msHint: "仅使用毫秒（1000 毫秒 = 1 秒）。",
  triggersTitle: "行为规则",
  autoInsertCreated: "向新文件添加 created",
  autoInsertUpdated: "向新文件添加 updated",
  autoInsertCreatedDesc:
    "当新文件没有任何属性时，插件会创建包含创建日期和时间的 YAML 字段并填入内容。",
  autoInsertUpdatedDesc:
    "当新文件没有任何属性时，插件会创建包含更新日期和时间的 YAML 字段并填入内容。",
  forceInsertCreated: "强制添加 created",
  forceInsertUpdated: "强制添加 updated",
  forceInsertCreatedDesc:
    "如果文件已有其他属性但缺少 created YAML 字段，插件会创建该字段并填入创建日期和时间。",
  forceInsertUpdatedDesc:
    "如果文件已有其他属性但缺少 updated YAML 字段，插件会创建该字段并填入更新日期和时间。",
  fillEmptyKeys: "填充 created 和 updated",
  fillEmptyKeysDesc:
    "如果文件属性中已有 created 或 updated 但为空，插件会在上方设定的延迟后填入当前日期和时间。",
  exclusionsTitle: "排除项",
  excludedFolders: "排除的文件夹",
  excludedFoldersDesc: "选择插件不会处理其内部文件的文件夹。",
  excludedFiles: "排除的文件",
  excludedFilesDesc: "选择插件不会处理的文件。",
  exclusionsNote: "所选文件夹不适用于「增强文件夹模板」部分。",
  folderPlaceholder: "搜索文件夹路径…",
  filePlaceholder: "搜索文件路径…",
  remove: "移除",
  dragToReorder: "拖动以重新排序",
  badgeTitle: "文件摘要",
  showBadge: "显示文件摘要",
  showBadgeDesc:
    "在文件属性顶部显示指标行。重要笔记信息集中在一行显示，无需打开 Obsidian 侧边面板。",
  staleWarning: "过期文件标记",
  staleWarningDesc:
    "若您长时间未编辑文件，则显示「过期」标记。用于提示可能需要检查或更新的闲置笔记。",
  staleDays: "过期期限",
  staleDaysDesc: "设置多少天未编辑后将文件视为过期。",
  yamlPct: "YAML 完整度 (%)",
  yamlPctDesc: "检查打开文件中的所有属性字段，并显示已填写键的比例。",
  fileSize: "磁盘上的文件大小",
  fileSizeDesc:
    "显示打开文件在磁盘上的大小。输入时实时更新，统计整个文档（含属性），而不仅是正文。",
  readingTime: "阅读时间",
  readingTimeDesc:
    "根据词数估算从头到尾阅读文件所需时间，并以分钟显示在属性上方。",
  wpm: "阅读速度",
  wpmDesc:
    "设置个人阅读速度以获得更准确的估算。成年人通常约为每分钟 180–240 个词。",
  focusTimer: "编辑时间",
  focusTimerDesc:
    "统计打开标签页中的活动时间。切换到其他 Obsidian 标签页时暂停，关闭文件时重置。显示当前会话时长，而非系统 mtime。",
  tasksIndicator: "已完成任务",
  tasksIndicatorDesc:
    "查找笔记中的所有复选框，并显示已完成任务与总数的比例。没有复选框时不显示。",
  isolatedIndicator: "孤立文件标记",
  isolatedIndicatorDesc:
    "当文件没有指向其他文件的出站或入站链接时，显示「孤立」标记。仅通过 resolvedLinks 索引检查已存在的文件；未找到连接时显示。",
  isolatedNote:
    "指向库中尚未创建的不存在「幽灵」文件的链接会被搜索索引忽略，不视为连接。",
  templatesTitle: "增强文件夹模板",
  templatesDesc: "在所选文件夹中创建新文件时自动应用指定模板。",
  addRule: "添加模板",
  statusBarTitle: "状态栏",
  statusBarShow: "日期和时间",
  statusBarShowDesc: "在状态栏显示当前日期和时间。",
  statusBarDateFormat: "日期格式",
  statusBarTimeFormat: "时间格式",
  statusBarMomentDesc: "日期和时间格式化使用 JavaScript 库 Moment.js。",
  statusBarFormatPreview: "预览：{preview}。",
  noticeLabel: "注意：",
  desktopOnlyBody: "仅在桌面版中可用。",
  fillEmptyName: "填充空日期",
  fillEmptyDesc: "使用文件系统中的文件日期填充空的 created 和 updated 字段。排除列表中的文件和文件夹不受影响。",
  fillEmptyButton: "填充",
  fillEmptyResult: "已更新文件数：{count}",
  backupTitle: "备份",
  backupName: "导出和导入设置",
  backupDesc: "将插件的所有设置保存到一个文件中。导入同一个文件即可在另一个库中应用这些设置。",
  exportButton: "导出",
  importButton: "导入",
  exportResult: "设置已导出到库根目录下的 frontmatter-plus-settings.json。",
  importResult: "设置已导入。",
  importMissing: "库根目录下未找到 frontmatter-plus-settings.json 文件。",
  templateConflict: "已有另一条规则为该文件夹指定了不同的模板。",
  resetTitle: "危险区域",
  resetName: "重置设置",
  resetDesc: "将所有插件设置恢复为默认值。",
  resetButton: "重置",
  indicatorMinRead: "{n} 分钟阅读",
  indicatorYaml: "YAML {n}%",
  indicatorStale: "过期 {n} 天",
  indicatorTasks: "{done}/{total} 任务",
  indicatorIsolated: "孤立",
  indicatorYamlError: "YAML 错误",
  sizeB: "{n} B",
  sizeKB: "{n} KB",
  sizeMB: "{n} MB",
  sizeGB: "{n} GB",
};

const fr: Dict = {
  language: "Langue de l’interface",
  languageDesc: "Définit la langue des réglages du plugin.",
  langEn: "Anglais",
  langDe: "Allemand",
  langZh: "Chinois",
  langFr: "Français",
  langRu: "Russe",
  coreTitle: "Propriétés des fichiers",
  createdKey: "Clé de date de création",
  createdKeyDesc:
    "Nom du champ YAML utilisé pour enregistrer la date et l’heure de création du fichier.",
  updatedKey: "Clé de date de mise à jour",
  updatedKeyDesc:
    "Nom du champ YAML utilisé pour enregistrer la date et l’heure de mise à jour du fichier.",
  dateFormat: "Format de date et d’heure",
  dateFormatDesc:
    "Le formatage de la date et de l’heure utilise la bibliothèque JavaScript Moment.js.",
  createDelay: "Délai après la création",
  createDelayDesc:
    "Durée en millisecondes (1000 ms = 1 seconde) avant d’écrire la date et l’heure de création dans le champ YAML choisi.",
  updateDelay: "Délai après la mise à jour",
  updateDelayDesc:
    "Durée en millisecondes (1000 ms = 1 seconde) avant d’écrire la date et l’heure de mise à jour dans le champ YAML choisi.",
  msHint: "Indiquez uniquement des millisecondes (1000 ms = 1 seconde).",
  triggersTitle: "Règles de comportement",
  autoInsertCreated: "Ajouter created aux nouveaux fichiers",
  autoInsertUpdated: "Ajouter updated aux nouveaux fichiers",
  autoInsertCreatedDesc:
    "Lorsqu’un nouveau fichier n’a aucune propriété, le plugin crée un champ YAML avec la date et l’heure de création et le remplit.",
  autoInsertUpdatedDesc:
    "Lorsqu’un nouveau fichier n’a aucune propriété, le plugin crée un champ YAML avec la date et l’heure de mise à jour et le remplit.",
  forceInsertCreated: "Forcer l’ajout de created",
  forceInsertUpdated: "Forcer l’ajout de updated",
  forceInsertCreatedDesc:
    "Si le fichier a déjà des propriétés mais que le champ YAML created est absent, le plugin l’ajoute et y inscrit la date et l’heure de création.",
  forceInsertUpdatedDesc:
    "Si le fichier a déjà des propriétés mais que le champ YAML updated est absent, le plugin l’ajoute et y inscrit la date et l’heure de mise à jour.",
  fillEmptyKeys: "Remplir created et updated",
  fillEmptyKeysDesc:
    "Si created ou updated existent déjà dans les propriétés du fichier mais sont vides, le plugin y inscrit la date et l’heure après le délai défini plus haut.",
  exclusionsTitle: "Exclusions",
  excludedFolders: "Dossiers exclus",
  excludedFoldersDesc:
    "Choisissez les dossiers dont les fichiers ne seront pas traités par le plugin.",
  excludedFiles: "Fichiers exclus",
  excludedFilesDesc: "Choisissez les fichiers que le plugin ne traitera pas.",
  exclusionsNote:
    "Les dossiers sélectionnés ne s’appliquent pas à la section «\u00a0Modèles de dossier améliorés\u00a0».",
  folderPlaceholder: "Rechercher un chemin de dossier…",
  filePlaceholder: "Rechercher un chemin de fichier…",
  remove: "Supprimer",
  dragToReorder: "Glisser pour réorganiser",
  badgeTitle: "Résumé du fichier",
  showBadge: "Afficher le résumé du fichier",
  showBadgeDesc:
    "Affiche une ligne de métriques en haut des propriétés du fichier. Les infos clés restent sur une seule ligne, sans ouvrir les panneaux latéraux d’Obsidian.",
  staleWarning: "Marquage des fichiers obsolètes",
  staleWarningDesc:
    "Affiche le marquage «\u00a0Obsolète\u00a0» si vous n’avez pas modifié le fichier depuis longtemps. Signale les notes délaissées qui méritent une vérification ou une mise à jour.",
  staleDays: "Obsolète après",
  staleDaysDesc:
    "Nombre de jours sans modification au-delà duquel un fichier est considéré comme obsolète.",
  yamlPct: "Complétude YAML (%)",
  yamlPctDesc:
    "Parcourt tous les champs de propriétés du fichier ouvert et indique la part des clés déjà renseignées.",
  fileSize: "Taille du fichier sur le disque",
  fileSizeDesc:
    "Affiche la taille du fichier ouvert sur le disque. Se met à jour pendant la saisie et couvre tout le document, propriétés comprises — pas seulement le corps de la note.",
  readingTime: "Temps de lecture",
  readingTimeDesc:
    "Estime le temps de lecture du fichier du début à la fin d’après le nombre de mots. Affiche le résultat en minutes au-dessus des propriétés.",
  wpm: "Vitesse de lecture",
  wpmDesc:
    "Définissez une vitesse de lecture personnelle pour une estimation plus précise. Chez un adulte, elle se situe souvent entre 180 et 240 mots par minute.",
  focusTimer: "Temps d’édition",
  focusTimerDesc:
    "Mesure le temps d’activité dans l’onglet ouvert. Se met en pause quand vous changez d’onglet Obsidian et se réinitialise à la fermeture du fichier. Affiche la durée de la session en cours, pas le mtime système.",
  tasksIndicator: "Tâches terminées",
  tasksIndicatorDesc:
    "Repère toutes les cases à cocher de la note et affiche les tâches terminées par rapport au total. Masqué s’il n’y a aucune case à cocher.",
  isolatedIndicator: "Marquage des fichiers isolés",
  isolatedIndicatorDesc:
    "Affiche le marquage «\u00a0Isolé\u00a0» si le fichier n’a ni liens entrants ni liens sortants vers d’autres fichiers. Vérifie uniquement les fichiers existants via l’index resolvedLinks. Apparaît lorsqu’aucune connexion n’est trouvée.",
  isolatedNote:
    "Les liens vers des fichiers fantômes inexistants, pas encore créés dans votre coffre, sont ignorés par l’index de recherche et ne comptent pas comme des connexions.",
  templatesTitle: "Modèles de dossier améliorés",
  templatesDesc:
    "Applique automatiquement le modèle choisi lors de la création de nouveaux fichiers dans le dossier sélectionné.",
  addRule: "Ajouter un modèle",
  statusBarTitle: "Barre d’état",
  statusBarShow: "Date et heure",
  statusBarShowDesc: "Affiche la date et l’heure actuelles dans la barre d’état.",
  statusBarDateFormat: "Format de date",
  statusBarTimeFormat: "Format d’heure",
  statusBarMomentDesc:
    "Le formatage de la date et de l’heure utilise la bibliothèque JavaScript Moment.js.",
  statusBarFormatPreview: "Aperçu\u00a0: {preview}.",
  noticeLabel: "Remarque\u00a0:",
  desktopOnlyBody: "Disponible uniquement sur ordinateur.",
  fillEmptyName: "Remplir les dates vides",
  fillEmptyDesc: "Remplit les champs created et updated vides avec la date du fichier issue du système de fichiers. Les fichiers et dossiers exclus ne sont pas concernés.",
  fillEmptyButton: "Remplir",
  fillEmptyResult: "Fichiers mis à jour : {count}",
  backupTitle: "Sauvegarde",
  backupName: "Exporter et importer les réglages",
  backupDesc: "Enregistre tous les réglages du plugin dans un fichier. Importez ce même fichier pour appliquer les réglages dans un autre coffre.",
  exportButton: "Exporter",
  importButton: "Importer",
  exportResult: "Réglages exportés vers frontmatter-plus-settings.json à la racine du coffre.",
  importResult: "Réglages importés.",
  importMissing: "Aucun fichier frontmatter-plus-settings.json trouvé à la racine du coffre.",
  templateConflict: "Une autre règle applique déjà un modèle différent à ce dossier.",
  resetTitle: "Zone dangereuse",
  resetName: "Réinitialiser les réglages",
  resetDesc: "Restaure tous les réglages du plugin aux valeurs par défaut.",
  resetButton: "Réinitialiser",
  indicatorMinRead: "{n} min de lecture",
  indicatorYaml: "YAML {n}%",
  indicatorStale: "Obsolète {n} j",
  indicatorTasks: "{done} sur {total} tâches",
  indicatorIsolated: "Isolé",
  indicatorYamlError: "Erreur YAML",
  sizeB: "{n} o",
  sizeKB: "{n} Ko",
  sizeMB: "{n} Mo",
  sizeGB: "{n} Go",
};

const ru: Dict = {
  language: "Язык интерфейса",
  languageDesc: "Определяет язык отображения настроек плагина.",
  langEn: "Английский",
  langDe: "Немецкий",
  langZh: "Китайский",
  langFr: "Французский",
  langRu: "Русский",
  coreTitle: "Свойства файлов",
  createdKey: "Ключ даты создания файла",
  createdKeyDesc:
    "Задайте имя YAML-поля, куда будет записываться дата и время создания файла.",
  updatedKey: "Ключ даты обновления файла",
  updatedKeyDesc:
    "Задайте имя YAML-поля, куда будет записываться дата и время обновления файла.",
  dateFormat: "Формат даты и времени",
  dateFormatDesc:
    "Для работы с датой и временем используется JavaScript-библиотека Moment.js.",
  createDelay: "Задержка после создания файла",
  createDelayDesc:
    "Время в миллисекундах (1000 мс = 1 секунда), через которое автоматически вносится дата и время создания файла в указанное YAML-поле.",
  updateDelay: "Задержка после обновления файла",
  updateDelayDesc:
    "Время в миллисекундах (1000 мс = 1 секунда), через которое автоматически вносится дата и время обновления файла в указанное YAML-поле.",
  msHint: "Указывается только в миллисекундах (1000 мс = 1 секунда).",
  triggersTitle: "Правила поведения",
  autoInsertCreated: "Добавлять created в новые файлы",
  autoInsertUpdated: "Добавлять updated в новые файлы",
  autoInsertCreatedDesc:
    "При создании нового файла без свойств плагин автоматически создаст YAML-поле с датой и временем создания файла и заполнит его.",
  autoInsertUpdatedDesc:
    "При создании нового файла без свойств плагин автоматически создаст YAML-поле с датой и временем обновления файла и заполнит его.",
  forceInsertCreated: "Принудительно добавлять created",
  forceInsertUpdated: "Принудительно добавлять updated",
  forceInsertCreatedDesc:
    "Если в уже существующем файле есть какие-то свойства, но YAML-поля created нет, плагин автоматически создаст его и заполнит датой и временем создания файла.",
  forceInsertUpdatedDesc:
    "Если в уже существующем файле есть какие-то свойства, но YAML-поля updated нет, плагин автоматически создаст его и заполнит датой и временем обновления файла.",
  fillEmptyKeys: "Заполнение created и updated",
  fillEmptyKeysDesc:
    "Если YAML-поля created или updated существуют в свойствах файла, но пустые, плагин периодически через указанную ранее задержку будет вносить в них дату и время.",
  exclusionsTitle: "Исключения",
  excludedFolders: "Исключенные папки",
  excludedFoldersDesc:
    "Выберите папки, с файлами внутри которых плагин не будет совершать никаких действий.",
  excludedFiles: "Исключенные файлы",
  excludedFilesDesc:
    "Выберите файлы, с которыми плагин не будет совершать никаких действий.",
  exclusionsNote:
    "Выбранные папки не распространяются на блок «Улучшенные шаблоны по папкам».",
  folderPlaceholder: "Поиск пути папки…",
  filePlaceholder: "Поиск пути файла…",
  remove: "Удалить",
  dragToReorder: "Перетащите для изменения порядка",
  badgeTitle: "Сводка о файле",
  showBadge: "Показывать сводку о файле",
  showBadgeDesc:
    "Выводит текстовую строку с метриками в верхней части свойств файла. Отображает важные параметры заметки в один ряд без открытия боковых вкладок Obsidian.",
  staleWarning: "Пометка устаревших файлов",
  staleWarningDesc:
    "Выводит метку «Устарел», если файл давно вами не редактировался. Сигнализирует о заброшенных записях, требующих проверки или актуализации данных.",
  staleDays: "Срок устаревания файлов",
  staleDaysDesc:
    "Задает критическое количество дней, по истечении которых нередактируемый файл признается залежавшимся и получает статус устаревшего.",
  yamlPct: "Заполненность YAML (%)",
  yamlPctDesc:
    "Проверяет в открытом файле все поля свойств и показывает процент заполненных ключей данными. Измеряет качество заполнения файла в свойствах.",
  fileSize: "Размер файла на диске",
  fileSizeDesc:
    "Показывает физический вес открытого файла на жестком диске. Значение обновляется в реальном времени по мере ввода текста. Метрика учитывает весь документ целиком, включая свойства заметки, а не только ее тело.",
  readingTime: "Время чтения файла",
  readingTimeDesc:
    "Рассчитывает примерное время на прочтение файла от начала до конца на основе общего количества слов. Выдает итоговый результат в минутах прямо над свойствами.",
  wpm: "Скорость чтения слов",
  wpmDesc:
    "Установите индивидуальную скорость чтения для более точного расчета времени на прочтение файла. Обычная скорость взрослого человека составляет от 180 до 240 слов в минуту.",
  focusTimer: "Время редактирования файла",
  focusTimerDesc:
    "Считает время активности в открытой вкладке. Таймер ставится на паузу, когда вы переключаетесь на другую вкладку Obsidian, и сбрасывается при закрытии файла. Показывает длительность текущего сеанса, а не системное время mtime.",
  tasksIndicator: "Подсчет выполненных задач",
  tasksIndicatorDesc:
    "Находит в заметке все чекбоксы и показывает соотношение выполненных задач к их общему количеству. Информация не выводится, если чекбоксы отсутствуют.",
  isolatedIndicator: "Пометка изолированных файлов",
  isolatedIndicatorDesc:
    "Выводит метку «Изолирован», если у файла отсутствуют входящие и исходящие ссылки на другие файлы. Проверка идет только по существующим файлам через индекс resolvedLinks. Метка отображается, когда не найдено ни одной связи.",
  isolatedNote:
    "Ссылки на несуществующие файлы-призраки, которые еще не были созданы в вашем хранилище, поисковым движком не учитываются и связями не считаются.",
  templatesTitle: "Улучшенные шаблоны по папкам",
  templatesDesc:
    "Автоматическое применение заданного шаблона при создании новых файлов в выбранной папке.",
  addRule: "Добавить шаблон",
  statusBarTitle: "Строка состояния",
  statusBarShow: "Дата и время",
  statusBarShowDesc: "Показывает текущие дату и время в строке состояния.",
  statusBarDateFormat: "Формат даты",
  statusBarTimeFormat: "Формат времени",
  statusBarMomentDesc:
    "Для работы с датой и временем используется JavaScript-библиотека Moment.js.",
  statusBarFormatPreview: "Предварительный просмотр: {preview}.",
  noticeLabel: "Внимание:",
  desktopOnlyBody: "Доступно только в десктопной версии.",
  fillEmptyName: "Заполнить пустые даты",
  fillEmptyDesc: "Заполняет пустые поля created и updated датой файла из файловой системы. Не затрагивает файлы и папки из списка исключений.",
  fillEmptyButton: "Заполнить",
  fillEmptyResult: "Обновлено файлов: {count}",
  backupTitle: "Резервная копия",
  backupName: "Экспорт и импорт настроек",
  backupDesc: "Сохраняет все настройки плагина в файл. Тот же файл можно импортировать, чтобы применить настройки в другом хранилище.",
  exportButton: "Экспорт",
  importButton: "Импорт",
  exportResult: "Настройки экспортированы в frontmatter-plus-settings.json в корне хранилища.",
  importResult: "Настройки импортированы.",
  importMissing: "Файл frontmatter-plus-settings.json не найден в корне хранилища.",
  templateConflict: "Для этой папки уже задан другой шаблон в другом правиле.",
  resetTitle: "Опасная зона",
  resetName: "Сброс настроек",
  resetDesc: "Возвращает все настройки плагина к значениям по умолчанию.",
  resetButton: "Сбросить",
  indicatorMinRead: "{n} мин. чтения",
  indicatorYaml: "YAML {n}%",
  indicatorStale: "Устарел {n} дн.",
  indicatorTasks: "{done} из {total} задач",
  indicatorIsolated: "Изолирован",
  indicatorYamlError: "Ошибка в YAML",
  sizeB: "{n} Б",
  sizeKB: "{n} КБ",
  sizeMB: "{n} МБ",
  sizeGB: "{n} ГБ",
};

const TABLES: Record<PluginLocale, Dict> = { en, de, zh, fr, ru };

export function t(locale: PluginLocale, key: string): string {
  return TABLES[locale]?.[key] ?? TABLES.en[key] ?? key;
}

export function tf(
  locale: PluginLocale,
  key: string,
  vars: Record<string, string | number>
): string {
  let out: string = t(locale, key);
  for (const keyName of Object.keys(vars)) {
    const value = vars[keyName];
    out = out.split(`{${keyName}}`).join(String(value));
  }
  return out;
}
