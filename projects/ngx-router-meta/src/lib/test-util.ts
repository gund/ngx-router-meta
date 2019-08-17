import {
  CompilerFactory,
  Injector,
  NgModuleFactory,
  StaticProvider,
  Type,
} from '@angular/core';
import { getTestBed } from '@angular/core/testing';

export function createModule<T>(
  moduleType: Type<T>,
  injectorOrProviders: Injector | StaticProvider[] = Injector.NULL,
) {
  const moduleDef = createCompiler().compileModuleAndAllComponentsSync(
    moduleType,
  );
  return _createModule(moduleDef.ngModuleFactory, injectorOrProviders);
}

export async function createModuleAsync<T>(
  moduleType: Type<T>,
  injectorOrProviders: Injector | StaticProvider[] = Injector.NULL,
) {
  const moduleDef = await createCompiler().compileModuleAndAllComponentsAsync(
    moduleType,
  );
  return _createModule(moduleDef.ngModuleFactory, injectorOrProviders);
}

function _createModule<T>(
  moduleFactory: NgModuleFactory<T>,
  injectorOrProviders: Injector | StaticProvider[] = Injector.NULL,
) {
  if (Array.isArray(injectorOrProviders)) {
    injectorOrProviders = Injector.create({ providers: injectorOrProviders });
  }

  return moduleFactory.create(injectorOrProviders);
}

function createCompiler() {
  return getCompilerFactory().createCompiler();
}

let compilerFactory: CompilerFactory | undefined;

function getCompilerFactory() {
  if (!compilerFactory) {
    compilerFactory = getTestBed().platform.injector.get<CompilerFactory>(
      CompilerFactory as any,
    );
  }
  return compilerFactory;
}
