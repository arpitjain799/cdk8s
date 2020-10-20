import { ApiObject, Lazy, Testing } from '../src';
import { resolve } from '../src/_resolve';

test('lazy', () => {
  // GIVEN
  const hello = {
    number: Lazy.any({ produce: () => 1234 }),
    string: Lazy.any({ produce: () => 'hello' }),
    implicit: createImplictToken(908),
  };

  expect(resolve(hello)).toStrictEqual({
    number: 1234,
    string: 'hello',
    implicit: 908,
  });
});

// this is how union tokens are generated by cdk8s-cli
function createImplictToken(value: any) {
  const implicit = {};
  Object.defineProperty(implicit, 'resolve', { value: () => value });
  return implicit;
}

test('does not resolve aws-cdk tokens', () => {

  const chart = Testing.chart();

  new ApiObject(chart, 'Pod', {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'mypod',
    },
    spec: {
      // this is how an aws-cdk token looks like in string form
      bucketName: '${Token[TOKEN.61]}',
      someLazyProperty: Lazy.any({ produce: () => 'lazyValue' }),
    },
  });

  const manifest = chart.toJson();

  expect(manifest).toEqual([{
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'mypod',
    },
    spec: {
      // aws-cdk token left untouched on chart synth.
      bucketName: '${Token[TOKEN.61]}',
      someLazyProperty: 'lazyValue',
    },
  }]);

});