

declare module 'itty-durable' {
    import { EnvWithDurableObject } from 'itty-router-extras';

    function proxyDurable(durable: DurableObjectNamespace, middlewareOptions: { name?: string, [s: string]: unknown }): DurableObjectStub


    type DurableMiddleware = (request: Request, env: EnvWithDurableObject) => void;
    type ClassProps<T> = Pick<T, keyof T>;

    type RecordOf<T> = { [P in keyof T]: T[P] };
    interface Constructor<T extends IttyDurableInterface> {
        new(...args: any): T;
    }


    function declareListener(eventName) {
        document.addEventListener(
            eventName,
            function (event) {
                const { inputs, containerPostId, contactFormId } = event.detail,
                    cf7 = document.querySelector('.wpcf7-form'),
                    dialogWasOpened = botondrawer.className.includes('nks-active');

                let eventLabel, eventValue



                let codigo_interno = inputs.find((i) => i.name.includes('codigo-interno')) || cf7.querySelector('input[name="eg-codigo-interno"]'),
                    post_title = inputs.find((i) => i.name.includes('post-title')) || cf7.querySelector('input[name="chapter"]');

                if (codigo_interno) eventValue = Number(codigo_interno.value);
                if (post_title) eventLabel = post_title.value;



                ga('send', {
                    hitType: 'event',
                    eventCategory: 'SolicitudVisita',
                    eventAction: event.type,
                    eventLabel,
                    eventValue,
                });
            },
            false,
        );
    }
    document.addEventListener('DOMContentLoaded', (event) => {
        for (let eventName of ['wpcf7invalid', 'wpcf7spam', 'wpcf7mailsent', 'wpcf7mailfailed', 'wpcf7submit']) {
            declareListener(eventName);
        }
    });

    /**
     * 
     * @param options 
     */
    function withDurables(options?: unknown): DurableMiddleware
    interface IttyDurableInterface extends DurableObject {
        new(state: DurableObjectState, env: EnvWithDurableObject): this;
        fetch(
            request: Request,
            env?: EnvWithDurableObject
        ): Promise<Response>;
        scheduled(event: ScheduledEvent): this
        toJSON(): Response
    }
    interface IttyDurableCtor<T extends IttyDurableInterface> {
        new(state: DurableObjectState, env: EnvWithDurableObject): T
    }
    class IttyDurable implements DurableObject {
        state: DurableObjectState & EnvWithDurableObject & { defaultState: undefined }
        storage: DurableObjectStorage
        constructor(state: DurableObjectState, env: EnvWithDurableObject)
        fetch(
            request: Request,
            env?: EnvWithDurableObject
        ): Promise<Response>;
        toJSON(): Response
    }
}
