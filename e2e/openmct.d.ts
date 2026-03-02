/**
 * TypeScript type definitions for NASA's Open MCT (Open Mission Control Technologies).
 *
 * Covers the full public API surface of the OpenMCT framework as exposed by the MCT class.
 * These definitions are intended for use in e2e tests and external consumers.
 */

declare module 'openmct' {
  export default OpenMCT;

  // ---- Core Types ----

  interface Identifier {
    namespace: string;
    key: string;
  }

  interface DomainObject {
    identifier: Identifier;
    name: string;
    type: string;
    location?: string;
    composition?: Identifier[];
    modified?: number;
    created?: number;
    persisted?: number;
    notes?: string;
    configuration?: Record<string, unknown>;
    telemetry?: Record<string, unknown>;
    [key: string]: unknown;
  }

  interface MutableDomainObject extends DomainObject {
    $observe(path: string, callback: (...args: unknown[]) => void): () => void;
    $set(path: string, value: unknown): void;
    $refresh(model: DomainObject): void;
    $on(event: string, callback: (...args: unknown[]) => void): () => void;
    $destroy(): void;
    isMutable: true;
  }

  interface BuildInfo {
    version: string;
    buildDate: string;
    revision: string;
    branch: string;
  }

  // ---- Plugin ----

  type OpenMCTPlugin = (openmct: OpenMCT) => void;

  // ---- Event Emitter ----

  interface EventEmitter {
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback: (...args: unknown[]) => void): void;
    emit(event: string, ...args: unknown[]): void;
    once?(event: string, callback: (...args: unknown[]) => void): void;
  }

  // ---- Time Types ----

  interface TimeSystem {
    key: string;
    name: string;
    cssClass?: string;
    timeFormat?: string;
    durationFormat?: string;
    isUTCBased?: boolean;
  }

  interface Clock {
    key: string;
    name: string;
    description?: string;
    cssClass?: string;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback: (...args: unknown[]) => void): void;
    currentValue(): number;
  }

  interface TimeConductorBounds {
    start: number;
    end: number;
  }

  interface ClockOffsets {
    start: number;
    end: number;
  }

  interface TimeContext extends EventEmitter {
    bounds(): TimeConductorBounds;
    setBounds(bounds: TimeConductorBounds): void;
    getTimeSystem(): TimeSystem;
    setTimeSystem(timeSystemOrKey: TimeSystem | string, bounds?: TimeConductorBounds): void;
    getMode(): string;
    setMode(mode: string, offsets?: ClockOffsets): void;
    getClock(): Clock | undefined;
    setClock(clockOrKey: Clock | string): void;
    getClockOffsets(): ClockOffsets;
    setClockOffsets(offsets: ClockOffsets): void;
    stopClock(): void;
  }

  interface IndependentTimeContext extends TimeContext {
    key: string;
    destroy(): void;
    resetContext(): void;
    getUpstreamContext(): TimeContext;
    followTimeContext(): void;
    setIndependentContext(): void;
  }

  // ---- Telemetry Types ----

  interface TelemetryRequestOptions {
    start?: number;
    end?: number;
    size?: number;
    strategy?: string;
    domain?: string;
    timeContext?: TimeContext;
    signal?: AbortSignal;
    filters?: Record<string, unknown>;
    [key: string]: unknown;
  }

  interface TelemetrySubscriptionOptions {
    strategy?: string;
    [key: string]: unknown;
  }

  interface TelemetryProvider {
    supportsRequest?(domainObject: DomainObject, options?: TelemetryRequestOptions): boolean;
    supportsSubscribe?(
      domainObject: DomainObject,
      callback?: (...args: unknown[]) => void,
      options?: TelemetrySubscriptionOptions
    ): boolean;
    supportsMetadata?(domainObject: DomainObject): boolean;
    supportsLimits?(domainObject: DomainObject): boolean;
    supportsStaleness?(domainObject: DomainObject): boolean;
    request?(domainObject: DomainObject, options?: TelemetryRequestOptions): Promise<object[]>;
    subscribe?(
      domainObject: DomainObject,
      callback: (datum: Record<string, unknown>) => void,
      options?: TelemetrySubscriptionOptions
    ): () => void;
    getMetadata?(domainObject: DomainObject): ValueMetadata[];
    getLimitEvaluator?(domainObject: DomainObject): LimitEvaluator;
    getLimits?(domainObject: DomainObject): LimitsResponseObject;
    isStale?(domainObject: DomainObject): Promise<StalenessResponseObject>;
    subscribeToStaleness?(
      domainObject: DomainObject,
      callback: (staleness: StalenessResponseObject) => void
    ): () => void;
    subscribeToLimits?(
      domainObject: DomainObject,
      callback: (limits: unknown) => void
    ): () => void;
  }

  interface ValueMetadata {
    key: string;
    name?: string;
    format?: string;
    source?: string;
    hints?: Record<string, number>;
    units?: string;
    min?: number;
    max?: number;
    enumerations?: Array<{ value: number | string; string: string }>;
    filters?: unknown[];
    [key: string]: unknown;
  }

  interface TelemetryMetadataManager {
    value(key: string): ValueMetadata;
    values(): ValueMetadata[];
    valuesForHints(hints: string[]): ValueMetadata[];
    isArrayValue(metadata: ValueMetadata): boolean;
    getFilterableValues(): ValueMetadata[];
    getUseToUpdateInPlaceValue(): ValueMetadata | undefined;
    getDefaultDisplayValue(): ValueMetadata | undefined;
  }

  interface TelemetryValueFormatter {
    parse(datum: unknown): unknown;
    format(datum: unknown): string;
    getNonArrayValue(value: unknown): string;
  }

  interface CustomStringFormatter {
    format(datum: unknown): string;
    setFormat(itemFormat: string): void;
  }

  interface Format {
    key: string;
    format(value: unknown, formatString?: string): string;
    parse?(text: string, formatString?: string): unknown;
    validate?(text: string): boolean;
  }

  interface RequestInterceptorDef {
    appliesTo(identifier: Identifier, request: TelemetryRequestOptions): boolean;
    invoke(identifier: Identifier, request: TelemetryRequestOptions): TelemetryRequestOptions;
  }

  interface StalenessResponseObject {
    isStale: boolean;
    timestamp?: number;
  }

  interface LimitViolation {
    cssClass?: string;
    name?: string;
    low?: Record<string, unknown>;
    high?: Record<string, unknown>;
    [key: string]: unknown;
  }

  interface LimitEvaluator {
    evaluate(datum: unknown, property?: ValueMetadata): LimitViolation | undefined;
  }

  interface LimitsResponseObject {
    limits?(): Promise<Record<string, Record<string, { cssClass: string; [key: string]: unknown }>>>;
    [key: string]: unknown;
  }

  interface TelemetryCollection extends EventEmitter {
    load(): void;
    destroy(): void;
    getAll(): object[];
  }

  // ---- Object Types ----

  interface ObjectProvider {
    get?(identifier: Identifier, abortSignal?: AbortSignal): Promise<DomainObject>;
    create?(domainObject: DomainObject): Promise<DomainObject>;
    update?(domainObject: DomainObject): Promise<DomainObject>;
    search?(query: string, abortSignal?: AbortSignal, searchType?: string): Promise<DomainObject[]>;
    supportsMutation?(): boolean;
    observe?(domainObject: DomainObject, callback: (...args: unknown[]) => void): () => void;
  }

  interface RootRegistry {
    addRoot(identifier: Identifier | string | (() => unknown), priority?: number): void;
    removeRoot(identifier: Identifier | string | (() => unknown)): void;
    getRoots(): Promise<Identifier[]>;
  }

  interface Transaction {
    add(object: DomainObject): void;
    cancel(): Promise<void[]>;
    commit(): Promise<void[]>;
    getDirtyObject(identifier: Identifier): DomainObject | undefined;
  }

  interface InterceptorDef {
    appliesTo(
      identifier: Identifier,
      domainObject: DomainObject
    ): boolean;
    invoke(
      identifier: Identifier,
      domainObject: DomainObject
    ): DomainObject;
  }

  interface ConflictErrorConstructor {
    new (message: string): ConflictError;
    prototype: ConflictError;
  }

  interface ConflictError extends Error {}

  // ---- Composition Types ----

  interface CompositionProvider {
    appliesTo(domainObject: DomainObject): boolean;
    load(domainObject: DomainObject): Promise<Identifier[]>;
    add?(domainObject: DomainObject, childId: Identifier): void;
    remove?(domainObject: DomainObject, childId: Identifier): void;
    reorder?(domainObject: DomainObject, oldIndex: number, newIndex: number): void;
  }

  interface CompositionCollection extends EventEmitter {
    load(): Promise<DomainObject[]>;
    add(child: DomainObject | Identifier, skipMutate?: boolean): void;
    remove(child: DomainObject | Identifier, skipMutate?: boolean): void;
    reorder(oldIndex: number, newIndex: number, skipMutate?: boolean): void;
    destroy(): void;
  }

  type CompositionPolicy = (
    container: DomainObject,
    containee: DomainObject
  ) => boolean;

  // ---- Type Types ----

  interface TypeDefinition {
    name?: string;
    description?: string;
    cssClass?: string;
    initialize?(domainObject: DomainObject): void;
    creatable?: boolean;
    form?: FormProperty[];
    [key: string]: unknown;
  }

  interface Type {
    key: string;
    definition: TypeDefinition;
    check(domainObject: DomainObject): boolean;
  }

  // ---- View Types ----

  interface ViewProvider {
    key: string;
    name?: string;
    cssClass?: string;
    canView?(domainObject: DomainObject, objectPath?: DomainObject[]): boolean;
    canEdit?(domainObject: DomainObject, objectPath?: DomainObject[]): boolean;
    view(domainObject: DomainObject, objectPath?: DomainObject[]): View;
    priority?(domainObject: DomainObject): number;
    [key: string]: unknown;
  }

  interface View {
    show(element: HTMLElement): void;
    destroy(): void;
    getSelectionContext?(): Record<string, unknown>;
    onEditModeChange?(isEditing: boolean): void;
    onClearData?(): void;
  }

  // ---- Action Types ----

  interface Action {
    key: string;
    name: string;
    description?: string;
    cssClass?: string;
    group?: string;
    priority?: number;
    invoke(objectPath: DomainObject[], view?: ViewProvider): void | Promise<void>;
    appliesTo?(objectPath: DomainObject[], view?: ViewProvider): boolean;
    [key: string]: unknown;
  }

  interface ActionCollection {
    getVisibleActions(): Action[];
    getStatusBarActions(): Action[];
    getObjectActions(): Action[];
    disable(actionKeys: string[]): void;
    enable(actionKeys: string[]): void;
    hide(actionKeys: string[]): void;
    show(actionKeys: string[]): void;
    destroy(): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback: (...args: unknown[]) => void): void;
  }

  // ---- Annotation Types ----

  interface Tag {
    key?: string;
    label?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    [key: string]: unknown;
  }

  interface CreateAnnotationOptions {
    name?: string;
    domainObject: DomainObject;
    annotationType: string;
    tags: string[];
    contentText?: string;
    targets: Record<string, unknown>;
    targetDomainObjects?: DomainObject[];
  }

  // ---- User Types ----

  interface User {
    getName(): string;
    getRole(): string;
    [key: string]: unknown;
  }

  interface UserProvider {
    getCurrentUser(): Promise<User>;
    isLoggedIn(): boolean;
    getPossibleRoles?(): Promise<string[]>;
    canProvideStatusForRole?(): boolean;
    hasRole?(roleId: string): boolean;
    getActiveRole?(): string | null;
    setActiveRole?(role: string | null): void;
  }

  // ---- Notification Types ----

  interface NotificationModel {
    message: string;
    severity?: string;
    progress?: number;
    progressText?: string;
    autoDismissTimeout?: number;
    timestamp?: number;
    minimized?: boolean;
    options?: unknown[];
  }

  interface OpenMCTNotification {
    model: NotificationModel;
    dismiss(): void;
    progress?(progressPerc: number, progressText?: string): void;
    on?(event: string, callback: (...args: unknown[]) => void): void;
    off?(event: string, callback: (...args: unknown[]) => void): void;
  }

  interface NotificationOptions {
    autoDismissTimeout?: number;
    minimized?: boolean;
    link?: {
      cssClass?: string;
      text: string;
      onClick: () => void;
    };
    [key: string]: unknown;
  }

  // ---- Overlay Types ----

  interface OverlayOptions {
    element: HTMLElement;
    size: 'small' | 'fit' | 'medium' | 'large';
    dismissable?: boolean;
    onDestroy?: () => void;
    buttons?: OverlayButton[];
    [key: string]: unknown;
  }

  interface OverlayButton {
    label: string;
    callback: () => void;
    emphasis?: boolean;
  }

  interface Overlay {
    dismiss(): void;
    show(): void;
    container?: HTMLElement;
  }

  interface DialogOptions extends OverlayOptions {
    title: string;
    iconClass?: string;
    message?: string;
  }

  interface Dialog extends Overlay {}

  interface ProgressDialogOptions {
    progressPerc?: number;
    progressText?: string;
    unknownProgress?: boolean;
    title?: string;
    hint?: string;
    timestamp?: number;
    [key: string]: unknown;
  }

  interface ProgressDialog extends Overlay {
    updateProgress(progressPerc: number, progressText?: string): void;
  }

  interface SelectionOptions extends OverlayOptions {
    title?: string;
    message?: string;
    selectionOptions?: Array<{
      key: string;
      name: string;
      description?: string;
      cssClass?: string;
    }>;
  }

  // ---- Menu Types ----

  interface MenuOptions {
    menuClass?: string;
    placement?: unknown;
    [key: string]: unknown;
  }

  // ---- Indicator Types ----

  interface SimpleIndicator {
    text(text?: string): string;
    description(description?: string): string;
    iconClass(iconClass?: string): string;
    statusClass(statusClass?: string): string;
    element?: HTMLElement;
  }

  // ---- Form Types ----

  interface FormProperty {
    control: string;
    cssClass?: string;
    key: string;
    name: string;
    required?: boolean;
    property?: string | string[];
    options?: unknown[];
    [key: string]: unknown;
  }

  // ---- Branding Types ----

  interface BrandingOptions {
    smallLogoImage?: string;
    aboutHtml?: string;
    links?: Array<{
      name: string;
      url: string;
    }>;
    [key: string]: unknown;
  }

  // ---- Router Types ----

  interface ApplicationRouter extends EventEmitter {
    path: string;
    destroy(): void;
    deleteSearchParam(paramName: string): void;
    getAllSearchParams(): URLSearchParams;
    getCurrentLocation(): CurrentLocation;
    getHashRelativeURL(): URL;
    getParams(): Record<string, string>;
    getSearchParam(paramName: string): string;
    navigate(hash: string): void;
    isNavigatedObject(objectPath: DomainObject[]): boolean;
    route(matcher: RegExp, callback: (...args: unknown[]) => void): void;
    set(path: string, queryString?: string): void;
    setAllSearchParams(): void;
    setLocationFromUrl(): void;
    setPath(path: string): void;
    setSearchParam(paramName: string, paramValue: string): void;
    start(): void;
    update(path: string, params?: Record<string, string>): void;
    updateParams(updateParams: Record<string, string>): void;
    updateTimeSettings(): void;
    afterNavigation?: (handler: (...args: unknown[]) => void) => void;
  }

  interface CurrentLocation {
    path: string;
    getQueryString(): string;
    getSearchParam(paramName: string): string;
  }

  // ---- Selection Types ----

  interface Selectable {
    context: Record<string, unknown>;
    element: HTMLElement;
  }

  // ---- Search Types ----

  interface SearchTypes {
    OBJECTS: string;
    ANNOTATIONS: string;
    TAGS: string;
  }

  interface AnnotationTypes {
    NOTEBOOK: string;
    GEOSPATIAL: string;
    PIXEL_SPATIAL: string;
    TEMPORAL: string;
    PLOT_SPATIAL: string;
  }

  interface SubscribeStrategy {
    LATEST: 'latest';
    BATCH: 'batch';
  }

  // ---- API Interfaces ----

  interface TimeAPI extends TimeContext {
    addTimeSystem(timeSystem: TimeSystem): void;
    getAllTimeSystems(): TimeSystem[];
    addClock(clock: Clock): void;
    getAllClocks(): Clock[];
    addIndependentContext(
      keyString: string,
      boundsOrOffsets: TimeConductorBounds | ClockOffsets,
      clockKey?: string
    ): () => void;
    getIndependentContext(key: string): IndependentTimeContext | undefined;
    getContextForView(objectPath: DomainObject[]): TimeContext;
  }

  interface ObjectAPI {
    SEARCH_TYPES: SearchTypes;
    errors: { Conflict: ConflictErrorConstructor };
    addProvider(namespace: string, provider: ObjectProvider): void;
    get(
      identifier: Identifier | string,
      abortSignal?: AbortSignal,
      forceRemote?: boolean
    ): Promise<DomainObject>;
    search(
      query: string,
      abortSignal?: AbortSignal,
      searchType?: string
    ): Promise<DomainObject[]>[];
    getMutable(identifier: Identifier): Promise<MutableDomainObject>;
    destroyMutable(domainObject: MutableDomainObject): void;
    save(domainObject: DomainObject): Promise<boolean>;
    mutate(domainObject: DomainObject, path: string, value: unknown): void;
    toMutable(domainObject: DomainObject): MutableDomainObject;
    refresh(
      domainObject: DomainObject,
      forceRemote?: boolean
    ): Promise<DomainObject>;
    observe(
      domainObject: DomainObject,
      path: string,
      callback: (...args: unknown[]) => void
    ): () => void;
    startTransaction(): Transaction;
    endTransaction(): void;
    isTransactionActive(): boolean;
    getActiveTransaction(): Transaction | undefined;
    addRoot(
      identifier: Identifier | string | (() => unknown),
      priority?: number
    ): void;
    removeRoot(identifier: Identifier | string | (() => unknown)): void;
    getRoot(): Promise<DomainObject>;
    getRootRegistry(): RootRegistry;
    getProvider(identifier: Identifier): ObjectProvider | undefined;
    addGetInterceptor(interceptorDef: InterceptorDef): void;
    makeKeyString(identifier: Identifier): string;
    parseKeyString(keyString: string): Identifier;
    areIdsEqual(...identifiers: Identifier[]): boolean;
    isReachable(originalPath: DomainObject[]): boolean;
    isPersistable(idOrKeyString: Identifier | string): boolean;
    isMissing(domainObject: DomainObject): boolean;
    supportsMutation(identifier: Identifier): boolean;
    getOriginalPath(
      identifierOrObject: string | Identifier | DomainObject,
      path?: DomainObject[],
      abortSignal?: AbortSignal
    ): Promise<DomainObject[]>;
    isObjectPathToALink(
      domainObject: DomainObject,
      objectPath: DomainObject[]
    ): boolean;
    getRelativePath(objectPath: DomainObject[]): string;
    getTelemetryPath(
      identifier: Identifier,
      telemetryIdentifier?: Identifier
    ): Promise<unknown[]>;
    getRelativeObjectPath(navigationPath: string): Promise<DomainObject[]>;
  }

  interface TelemetryAPI {
    SUBSCRIBE_STRATEGY: SubscribeStrategy;
    abortAllRequests(): void;
    isTelemetryObject(domainObject: DomainObject): boolean;
    canProvideTelemetry(domainObject: DomainObject): boolean;
    addProvider(provider: TelemetryProvider): void;
    findSubscriptionProvider(
      domainObject?: DomainObject,
      options?: TelemetrySubscriptionOptions
    ): TelemetryProvider | undefined;
    findRequestProvider(
      domainObject?: DomainObject,
      options?: TelemetryRequestOptions
    ): TelemetryProvider | undefined;
    standardizeRequestOptions(
      options?: TelemetryRequestOptions
    ): TelemetryRequestOptions;
    hasNumericTelemetry(domainObject: DomainObject): boolean;
    addRequestInterceptor(requestInterceptorDef: RequestInterceptorDef): void;
    /** Toggle or query greedy LAD (Latest Available Data) mode. */
    greedyLAD(isGreedy?: boolean): boolean | void;
    requestCollection(
      domainObject: DomainObject,
      options?: TelemetryRequestOptions
    ): TelemetryCollection;
    request(
      domainObject: DomainObject,
      options?: TelemetryRequestOptions
    ): Promise<object[]>;
    subscribe(
      domainObject: DomainObject,
      callback: (datum: Record<string, unknown>) => void,
      options?: TelemetrySubscriptionOptions
    ): () => void;
    subscribeToStaleness(
      domainObject: DomainObject,
      callback: (staleness: StalenessResponseObject) => void
    ): () => void;
    subscribeToLimits(
      domainObject: DomainObject,
      callback: (limits: unknown) => void
    ): () => void;
    isStale(domainObject: DomainObject): Promise<StalenessResponseObject>;
    getMetadata(domainObject: DomainObject): TelemetryMetadataManager;
    getValueFormatter(valueMetadata: ValueMetadata): TelemetryValueFormatter;
    getFormatter(key: string): TelemetryValueFormatter;
    getFormatMap(
      metadata: TelemetryMetadataManager
    ): Record<string, TelemetryValueFormatter>;
    addFormat(format: Format): void;
    limitEvaluator(domainObject: DomainObject): LimitEvaluator;
    limitDefinition(domainObject: DomainObject): LimitsResponseObject;
    getLimitEvaluator(domainObject: DomainObject): LimitEvaluator;
    getLimits(domainObject: DomainObject): LimitsResponseObject;
    customStringFormatter(
      valueMetadata: ValueMetadata,
      format: string
    ): CustomStringFormatter;
  }

  interface CompositionAPI {
    addProvider(provider: CompositionProvider): void;
    get(domainObject: DomainObject): CompositionCollection | undefined;
    addPolicy(policy: CompositionPolicy): void;
    checkPolicy(container: DomainObject, containee: DomainObject): boolean;
    supportsComposition(domainObject: DomainObject): boolean;
  }

  interface TypeRegistry {
    addType(typeKey: string, typeDef: TypeDefinition): void;
    listKeys(): string[];
    get(typeKey: string): Type;
    getAllTypes(): Record<string, Type>;
  }

  interface ActionsAPI extends EventEmitter {
    register(actionDefinition: Action): void;
    getAction(key: string): Action | undefined;
    getActionsCollection(
      objectPath: DomainObject[],
      view?: ViewProvider
    ): ActionCollection;
    updateGroupOrder(groupArray: string[]): void;
  }

  interface AnnotationAPI extends EventEmitter {
    ANNOTATION_TYPES: AnnotationTypes;
    create(options: CreateAnnotationOptions): Promise<DomainObject>;
    defineTag(tagKey: string, tagsDefinition: Tag): void;
    setNamespaceToSaveAnnotations(namespace: string): void;
    isAnnotation(domainObject: DomainObject): boolean;
    getAvailableTags(): Tag[];
    getAnnotations(
      domainObjectIdentifier: Identifier,
      abortSignal?: AbortSignal
    ): Promise<DomainObject[]>;
    deleteAnnotations(annotations: DomainObject[]): void;
    unDeleteAnnotation(annotation: DomainObject): void;
    getTagsFromAnnotations(
      annotations: DomainObject[],
      filterDuplicates?: boolean
    ): Tag[];
    searchForTags(query: string, abortSignal?: AbortSignal): Promise<unknown[]>;
    addTargetComparator(
      annotationType: string,
      comparator: (t1: unknown, t2: unknown) => boolean
    ): void;
    areAnnotationTargetsEqual(
      annotationType: string,
      targets: unknown,
      otherTargets: unknown
    ): boolean;
    isAnnotatableType(type: string): boolean;
  }

  interface UserAPI extends EventEmitter {
    setProvider(provider: UserProvider): void;
    getProvider(): UserProvider | undefined;
    hasProvider(): boolean;
    getCurrentUser(): Promise<User>;
    getPossibleRoles(): Promise<string[]>;
    getActiveRole(): string | null;
    setActiveRole(role: string | null): void;
    canProvideStatusForRole(): boolean | null;
    isLoggedIn(): boolean;
    hasRole(roleId: string): boolean;
  }

  interface StatusAPI {
    get(identifier: Identifier): unknown;
    set(identifier: Identifier, status: unknown): void;
    delete(identifier: Identifier): void;
    observe(
      identifier: Identifier,
      callback: (value: unknown) => void
    ): () => void;
  }

  interface NotificationAPI extends EventEmitter {
    info(message: string, options?: NotificationOptions): OpenMCTNotification;
    alert(message: string, options?: NotificationOptions): OpenMCTNotification;
    error(message: string, options?: NotificationOptions): OpenMCTNotification;
    progress(
      message: string,
      progressPerc: number | null,
      progressText?: string
    ): OpenMCTNotification;
    dismissAllNotifications(): void;
  }

  interface EditorAPI extends EventEmitter {
    edit(): void;
    isEditing(): boolean;
    save(): Promise<void>;
    cancel(): Promise<void>;
  }

  interface OverlayAPI {
    overlay(options: OverlayOptions): Overlay;
    dialog(options: DialogOptions): Dialog;
    progressDialog(options: ProgressDialogOptions): ProgressDialog;
    selection(options: SelectionOptions): Overlay;
  }

  interface MenuAPI {
    showMenu(
      x: number,
      y: number,
      items: unknown[],
      menuOptions?: MenuOptions
    ): void;
    actionsToMenuItems(
      actions: unknown[],
      objectPath: DomainObject[],
      view: ViewProvider
    ): unknown[];
    showSuperMenu(
      x: number,
      y: number,
      actions: unknown[],
      menuOptions?: MenuOptions
    ): void;
  }

  interface IndicatorAPI {
    getIndicatorObjectsByPriority(): unknown[];
    simpleIndicator(): SimpleIndicator;
    add(indicator: unknown): void;
  }

  interface FormsAPI {
    addNewFormControl(controlName: string, controlViewProvider: unknown): void;
    getFormControl(controlName: string): unknown;
    showForm(
      formStructure: FormProperty[],
      options?: { onChange?: (...args: unknown[]) => void }
    ): Promise<Record<string, unknown>>;
    showCustomForm(
      formStructure: FormProperty[],
      options?: {
        element?: HTMLElement;
        onChange?: (...args: unknown[]) => void;
      }
    ): Promise<Record<string, unknown>>;
  }

  interface ToolTipAPI {
    removeAllTooltips(): void;
    tooltip(options: unknown): unknown;
  }

  interface FaultManagementAPI {
    addProvider(provider: unknown): void;
    supportsActions(): boolean;
    request(domainObject: DomainObject): Promise<unknown[]>;
    subscribe(
      domainObject: DomainObject,
      callback: (...args: unknown[]) => void
    ): () => void;
    acknowledgeFault(fault: unknown, ackData: unknown): Promise<unknown>;
    shelveFault(fault: unknown, shelveData: unknown): Promise<unknown>;
    getShelveDurations(): unknown[] | undefined;
  }

  type BrandingAPI = (options?: BrandingOptions) => BrandingOptions;

  interface PriorityAPI {
    HIGHEST: number;
    HIGH: number;
    DEFAULT: number;
    LOW: number;
    LOWEST: number;
  }

  interface ViewRegistry {
    get(item: DomainObject, objectPath?: DomainObject[]): ViewProvider[];
    addProvider(provider: ViewProvider): void;
    getByProviderKey(key: string): ViewProvider;
  }

  interface InspectorViewRegistry {
    get(selection: Selectable[]): ViewProvider[];
    addProvider(provider: ViewProvider): void;
    getByProviderKey(key: string): ViewProvider;
  }

  interface ToolbarRegistry {
    get(selection: Selectable[]): unknown[];
    addProvider(provider: unknown): void;
  }

  interface Selection {
    get(): Selectable[][];
    selectable(
      element: HTMLElement,
      context: Record<string, unknown>,
      select?: boolean | Event
    ): () => void;
  }

  // ---- Main OpenMCT Class ----

  interface OpenMCT extends EventEmitter {
    buildInfo: BuildInfo;
    defaultClock: string;
    plugins: Record<string, (...args: unknown[]) => OpenMCTPlugin> & {
      [key: string]: unknown;
    };
    selection: Selection;
    time: TimeAPI;
    composition: CompositionAPI;
    objectViews: ViewRegistry;
    inspectorViews: InspectorViewRegistry;
    propertyEditors: ViewRegistry;
    toolbars: ToolbarRegistry;
    types: TypeRegistry;
    objects: ObjectAPI;
    telemetry: TelemetryAPI;
    indicators: IndicatorAPI;
    user: UserAPI;
    notifications: NotificationAPI;
    editor: EditorAPI;
    overlays: OverlayAPI;
    tooltips: ToolTipAPI;
    menus: MenuAPI;
    actions: ActionsAPI;
    status: StatusAPI;
    priority: PriorityAPI;
    router: ApplicationRouter;
    faults: FaultManagementAPI;
    forms: FormsAPI;
    branding: BrandingAPI;
    annotation: AnnotationAPI;

    performance: {
      measurements: Map<string, unknown>;
    };
    layout: {
      $refs: Record<string, { $refs: Record<string, { firstChild: Node | null }> }>;
    };

    setAssetPath(assetPath: string): void;
    getAssetPath(): string;
    start(domElementOrSelector?: Element | string, isHeadlessMode?: boolean): void;
    startHeadless(): void;
    install(plugin: OpenMCTPlugin): void;
    destroy(): void;
  }
}
